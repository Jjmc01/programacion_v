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
function normalizeSort(sort, order) {
    const column = sortableFields[sort] || sortableFields.nombre;
    const direction = String(order).toLocaleLowerCase() === "desc" ? "DESC" : "ASC";

    return `${column} ${direction}`;
}

// Esta función toma una fila cruda devuelta por MySQL y la convierte en un objeto JavaScript
// más amigable para la aplicación. Es importante porque en SQL los nombres de columnas suelen
// incluir prefijos o usar snake_case, mientras que en el backend se prefiere trabajar con
// propiedades como "createdAt" y "updatedAt" en formato camelCase.
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
     WHERE m.id_materia = ? AND m.id_usuario = ?`,
     [id, userId]
  );

  // La respuesta final incluye la lista de materias ya convertidas a objetos limpios y el total
  // de registros que existen con esos filtros, lo que permite al cliente renderizar la UI con
  // la información correcta de paginación.
  return {
    materias: rows.map(mapMateriaRow),
    total: countRows[0].total
  };
}

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
       