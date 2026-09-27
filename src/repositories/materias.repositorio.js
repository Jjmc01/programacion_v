import { pool } from "../config/database.js";

// Este objeto funciona como un diccionario que convierte nombres legibles de campos
// del negocio, como "nombre" o "creditos", en las columnas reales de la tabla "materia".
// Así, la lógica de ordenamiento puede recibir valores simples y luego traducirlos a SQL
// sin duplicar la cadena de la consulta cada vez que ordenamos.
const sortableFields = {
    id: "m.id_materia",
    nombre: "m.nombre",
    codigo: "m.codigo",
    creditos: "m.creditos",
    color: "m.color",
    activa: "m.activa",
    createdAt: "m.created_at",
    updatedAt: "m.updated_at"
};

// Esta función normaliza el campo de orden y la dirección solicitada por el cliente.
// Por ejemplo, si el usuario quiere ordenar por "creditos" y en orden descendente,
// convierte eso en "m.creditos DESC". Si no se especifica un campo válido, usa "m.nombre"
// como predeterminado para mantener un orden consistente.
/**
 * Convierte el campo y sentido de orden solicitados en una expresión SQL permitida.
 *
 * @function normalizeSort
 * @param {string} [sort] - Nombre lógico del campo por el que se desea ordenar.
 * @param {string} [order] - Sentido del ordenamiento; solo desc produce orden descendente.
 * @returns {string} Expresión SQL formada con una columna de la lista permitida y ASC o DESC.
 */
function normalizeSort(sort, order) {
    const column = sortableFields[sort] || sortableFields.nombre;
    const direction = String(order).toLocaleLowerCase() === "desc" ? "DESC" : "ASC";

    return `${column} ${direction}`;
}

// Esta función toma una fila cruda devuelta por MySQL y la convierte en un objeto JavaScript
// más amigable para la aplicación. Es importante porque en SQL los nombres de columnas suelen
// incluir prefijos o usar snake_case, mientras que en el backend se prefiere trabajar con
// propiedades como "createdAt" y "updatedAt" en formato camelCase.
/**
 * Convierte una fila de la base de datos en el formato de materia usado por la aplicación.
 *
 * @function mapMateriaRow
 * @param {Object} row - Fila devuelta por MySQL con columnas de la tabla materia.
 * @returns {Object} Materia con propiedades en camelCase y nombres consistentes para la API.
 */
function mapMateriaRow(row) {
    return {
        id: row.id ?? row.id_materia,
        nombre: row.nombre,
        codigo: row.codigo,
        creditos: row.creditos,
        color: row.color,
        activa: row.activa,
        createdAt: row.created_at,
        updatedAt: row.updated_at
    };
}

// Esta función es la consulta principal del repositorio: obtiene todas las materias asociadas
// a un usuario específico, aplicando filtros opcionales como "activa", búsqueda por texto y
// paginación. Primero arma un conjunto de condiciones SQL y un arreglo de parámetros para evitar
// inyección y mantener la consulta segura.
/**
 * Consulta las materias de un usuario, aplicando filtros, orden y paginación.
 *
 * @async
 * @function findAllByUserId
 * @param {string|number} userId - Identificador del usuario propietario de las materias.
 * @param {Object} [filters={}] - Filtros previamente validados para la consulta.
 * @param {boolean} [filters.activa] - Estado de actividad por el que se filtra.
 * @param {string} [filters.search] - Texto que se compara con nombre y código.
 * @param {string} [filters.sort] - Nombre lógico del campo para ordenar.
 * @param {string} [filters.order] - Sentido del ordenamiento.
 * @param {number} [filters.page=1] - Página solicitada.
 * @param {number} [filters.limit=20] - Número máximo de filas por página.
 * @returns {Promise<{materias: Object[], total: number}>} Materias mapeadas y cantidad total que coincide con los filtros.
 * @throws {Error} Propaga errores generados por las consultas de MySQL.
 */
export async function findAllByUserId(userId, filters = {}) {
  // Se empieza siempre por la condición base: la materia debe pertenecer al usuario indicado.
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  // Si el cliente envía el filtro "activa", se convierte a 1 o 0 porque en la base de datos
  // suele almacenarse como un valor booleano numérico (0/1).
  if (typeof filters.activa === "boolean") {
    conditions.push("m.activa = ?");
    params.push(filters.activa ? 1 : 0);
  }

  // Si hay un término de búsqueda, se busca tanto en el nombre como en el código de la materia.
  // El uso de LIKE con %...% permite una búsqueda aunque no este completo.
  if (filters.search) {
    conditions.push("(m.nombre LIKE ? OR m.codigo LIKE ?)");
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  // Antes de devolver resultados, se calcula el total de registros que cumplen el filtro.
  // Esto es útil para saber cuántas páginas existen y para la paginación en la interfaz.
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM materia m
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  // Se transforma el orden solicitado por el cliente en una cláusula SQL válida.
  // La paginación también se calcula a partir del número de página y el límite por página.
  const orderBy = normalizeSort(filters.sort, filters.order);
  const limit = filters.limit;
  const offset = (filters.page - 1) * limit;

  // Se ejecuta la consulta final con la selección de columnas, filtros, orden y paginación.
  // El SELECT devuelve filas con nombres específicos de la BD, así que luego se mapearán a un
  // formato más claro para la aplicación.
  const [rows] = await pool.execute(
    `SELECT
       m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at AS createdAt,
       m.updated_at AS updatedAt
      FROM materia m
      WHERE ${conditions.join(" AND ")}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  // La respuesta final incluye la lista de materias ya convertidas a objetos limpios y el total
  // de registros que existen con esos filtros, lo que permite al cliente renderizar la UI con
  // la información correcta de paginación.
  return {
    materias: rows.map(mapMateriaRow),
    total: countRows[0].total
  };
}

/**
 * Busca una materia mediante su ID y el ID de su usuario propietario.
 *
 * @async
 * @function findByIdAndUserId
 * @param {string|number} id - Identificador de la materia.
 * @param {string|number} userId - Identificador del usuario propietario.
 * @returns {Promise<Object|null>} Materia mapeada o null si no se encontró una coincidencia.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `SELECT
    m.id_materia AS id,
       m.id_usuario AS usuarioId,
       m.nombre,
       m.codigo,
       m.color,
       m.creditos,
       m.activa,
       m.created_at,
       m.updated_at
     FROM materia m
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
    [id, userId]
  );

    return rows[0] ? mapMateriaRow(rows[0]) : null;
}


/**
 * Comprueba si el usuario ya tiene una materia con el código indicado.
 *
 * @async
 * @function existsByCode
 * @param {string|number} userId - Identificador del usuario propietario.
 * @param {string} codigo - Código de materia que se desea buscar.
 * @param {string|number} [excludeId] - ID opcional de una materia que debe excluirse.
 * @returns {Promise<boolean>} true si existe una coincidencia; false en caso contrario.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function existsByCode(userId, codigo, excludeId) {
  const params = [userId, codigo];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND codigo = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}

/**
 * Comprueba si el usuario ya tiene una materia con el nombre indicado.
 *
 * @async
 * @function existsByName
 * @param {string|number} userId - Identificador del usuario propietario.
 * @param {string} nombre - Nombre de materia que se desea buscar.
 * @param {string|number} [excludeId] - ID opcional de una materia que debe excluirse.
 * @returns {Promise<boolean>} true si existe una coincidencia; false en caso contrario.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function existsByName(userId, nombre, excludeId) {
  const params = [userId, nombre];
  let sql = "SELECT 1 FROM materia WHERE id_usuario = ? AND nombre = ?";

  if (excludeId) {
    sql += " AND id_materia <> ?";
    params.push(excludeId);
  }

  sql += " LIMIT 1";

  const [rows] = await pool.execute(sql, params);
  return rows.length > 0;
}
       

/**
 * Inserta una materia asociada al usuario y vuelve a consultarla para devolver el objeto creado.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador del usuario que será propietario de la materia.
 * @param {Object} materia - Campos que se insertarán en la tabla materia.
 * @param {string} materia.nombre - Nombre de la materia.
 * @param {string} materia.codigo - Código de la materia.
 * @param {string} materia.color - Color hexadecimal de la materia.
 * @param {number} materia.creditos - Número de créditos de la materia.
 * @param {boolean} materia.activa - Estado activo o inactivo de la materia.
 * @returns {Promise<Object>} Materia insertada y recuperada por su ID y usuario.
 * @throws {Error} Propaga errores generados al insertar o volver a consultar la materia.
 */
export async function createMateria(userId, materia) {
  const [result] = await pool.execute(
    `INSERT INTO materia (id_usuario, nombre, codigo, color, creditos, activa)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      userId,
      materia.nombre,
      materia.codigo,
      materia.color,
      materia.creditos,
      materia.activa ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

/**
 * Actualiza en la base de datos únicamente los campos definidos de una materia del usuario.
 *
 * @async
 * @function patchMateria
 * @param {string|number} id - Identificador de la materia que se modificará.
 * @param {string|number} userId - Identificador del usuario propietario; limita la actualización.
 * @param {Object} partialMateria - Propiedades de materia que se deben actualizar.
 * @param {string} [partialMateria.nombre] - Nuevo nombre, si fue enviado.
 * @param {string} [partialMateria.codigo] - Nuevo código, si fue enviado.
 * @param {string} [partialMateria.color] - Nuevo color, si fue enviado.
 * @param {number} [partialMateria.creditos] - Nueva cantidad de créditos, si fue enviada.
 * @param {boolean} [partialMateria.activa] - Nuevo estado, si fue enviado.
 * @returns {Promise<Object>} Materia consultada después de la actualización.
 * @throws {Error} Propaga errores generados por la actualización o consulta de MySQL.
 */
export async function patchMateria(id, userId, partialMateria) {
  const fields = [];
  const params = [];

  if (partialMateria.nombre !== undefined) {
    fields.push("nombre = ?");
    params.push(partialMateria.nombre);
  }

  if (partialMateria.codigo !== undefined) {
    fields.push("codigo = ?");
    params.push(partialMateria.codigo);
  }

  if (partialMateria.color !== undefined) {
    fields.push("color = ?");
    params.push(partialMateria.color);
  }

  if (partialMateria.creditos !== undefined) {
    fields.push("creditos = ?");
    params.push(partialMateria.creditos);
  }

  if (partialMateria.activa !== undefined) {
    fields.push("activa = ?");
    params.push(partialMateria.activa ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  params.push(id, userId);

  await pool.execute(
    `UPDATE materia
     SET ${fields.join(", ")}
     WHERE id_materia = ? AND id_usuario = ?`,
    params
  );

  return findByIdAndUserId(id, userId);
}


/**
 * Elimina una materia solo cuando coincide tanto su ID como el usuario propietario.
 *
 * @async
 * @function deleteMateria
 * @param {string|number} id - Identificador de la materia que se eliminará.
 * @param {string|number} userId - Identificador del usuario propietario.
 * @returns {Promise<boolean>} true si MySQL eliminó una fila; false si no hubo coincidencias.
 * @throws {Error} Propaga errores generados por la consulta de eliminación.
 */
export async function deleteMateria(id, userId) {
  const [result] = await pool.execute(
    "DELETE FROM materia WHERE id_materia = ? AND id_usuario = ?",
    [id, userId]
  );

  return result.affectedRows > 0;
}

