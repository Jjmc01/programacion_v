import { pool } from "../config/database.js";

// Las consultas parten de recordatorio y recorren sus relaciones hasta materia.
// El filtro m.id_usuario limita tanto las lecturas como las escrituras al dueño del dato.
const recordatorioJoins = `
  FROM recordatorio r
  INNER JOIN tarea t ON t.id_tarea = r.id_tarea
  INNER JOIN materia m ON m.id_materia = t.id_materia`;

const recordatorioSelect = `
  SELECT
    r.id_recordatorio AS id,
    r.id_tarea AS tareaId,
    r.mensaje,
    r.fecha_hora AS fechaHora,
    r.canal,
    r.leido,
    r.created_at AS createdAt,
    t.titulo AS tareaTitulo,
    t.fecha_entrega AS tareaFechaEntrega,
    t.estado AS tareaEstado,
    m.id_materia AS materiaId,
    m.nombre AS materiaNombre,
    m.codigo AS materiaCodigo
  ${recordatorioJoins}`;

const sortableFields = {
  id: "r.id_recordatorio",
  mensaje: "r.mensaje",
  fechaHora: "r.fecha_hora",
  createdAt: "r.created_at",
  tareaTitulo: "t.titulo",
  materiaNombre: "m.nombre"
};

/**
 * Convierte el orden solicitado en una columna conocida y una dirección segura.
 *
 * @param {string} sort - Campo lógico de ordenamiento.
 * @param {string} order - Dirección solicitada.
 * @returns {string} Fragmento SQL construido solo con opciones permitidas.
 */
function normalizeSort(sort, order) {
  const column = sortableFields[sort] || sortableFields.fechaHora;
  const direction = String(order).toLowerCase() === "desc" ? "DESC" : "ASC";

  return `${column} ${direction}`;
}

/**
 * Obtiene recordatorios del usuario y sus datos relacionados con tarea y materia.
 *
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @param {Object} filters - Filtros ya validados, incluyendo paginación y orden.
 * @returns {Promise<{recordatorios: Object[], total: number}>} Filas y cantidad total coincidente.
 * @throws {Error} Propaga errores generados por las consultas de MySQL.
 */
export async function findAllByUserId(userId, filters) {
  const conditions = ["m.id_usuario = ?"];
  const params = [userId];

  if (typeof filters.leido === "boolean") {
    conditions.push("r.leido = ?");
    params.push(filters.leido ? 1 : 0);
  }

  if (filters.canal) {
    conditions.push("r.canal = ?");
    params.push(filters.canal);
  }

  if (filters.tareaId !== undefined) {
    conditions.push("r.id_tarea = ?");
    params.push(filters.tareaId);
  }

  if (filters.search) {
    conditions.push("(r.mensaje LIKE ? OR t.titulo LIKE ? OR m.nombre LIKE ?)");
    const search = `%${filters.search}%`;
    params.push(search, search, search);
  }

  // El JOIN sigue relaciones de muchos a uno, así cada recordatorio aparece una sola vez.
  const [countRows] = await pool.execute(
    `SELECT COUNT(*) AS total
     ${recordatorioJoins}
     WHERE ${conditions.join(" AND ")}`,
    params
  );

  const orderBy = normalizeSort(filters.sort, filters.order);
  const offset = (filters.page - 1) * filters.limit;

  const [rows] = await pool.execute(
    `${recordatorioSelect}
     WHERE ${conditions.join(" AND ")}
     ORDER BY ${orderBy}, r.id_recordatorio ASC
     LIMIT ? OFFSET ?`,
    [...params, filters.limit, offset]
  );

  return {
    recordatorios: rows.map(mapRecordatorioRow),
    total: Number(countRows[0].total)
  };
}

/**
 * Convierte la fila SQL al formato camelCase que utiliza la API.
 *
 * @param {Object} row - Fila devuelta por MySQL.
 * @returns {Object} Recordatorio con datos descriptivos de la tarea y la materia.
 */
function mapRecordatorioRow(row) {
  return {
    id: row.id,
    tareaId: row.tareaId,
    mensaje: row.mensaje,
    fechaHora: row.fechaHora,
    canal: row.canal,
    leido: Boolean(row.leido),
    createdAt: row.createdAt,
    tarea: {
      titulo: row.tareaTitulo,
      fechaEntrega: row.tareaFechaEntrega,
      estado: row.tareaEstado
    },
    materia: {
      id: row.materiaId,
      nombre: row.materiaNombre,
      codigo: row.materiaCodigo
    }
  };
}

/**
 * Busca un recordatorio únicamente si pertenece a una materia del usuario indicado.
 *
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - ID del usuario autenticado.
 * @returns {Promise<Object|null>} Recordatorio encontrado o null.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function findByIdAndUserId(id, userId) {
  const [rows] = await pool.execute(
    `${recordatorioSelect}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return rows[0] ? mapRecordatorioRow(rows[0]) : null;
}

/**
 * Comprueba que una tarea pertenezca a una materia del usuario autenticado.
 *
 * @param {string|number} tareaId - ID de la tarea que se asociará al recordatorio.
 * @param {string|number} userId - ID del usuario autenticado.
 * @returns {Promise<boolean>} true si la tarea pertenece al usuario.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function tareaBelongsToUser(tareaId, userId) {
  const [rows] = await pool.execute(
    `SELECT t.id_tarea
     FROM tarea t
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE t.id_tarea = ? AND m.id_usuario = ?
     LIMIT 1`,
    [tareaId, userId]
  );

  return rows.length > 0;
}

/**
 * Inserta una fila exclusivamente en recordatorio y devuelve el registro creado.
 *
 * @param {string|number} userId - ID del usuario autenticado.
 * @param {Object} recordatorio - Campos ya validados que se insertarán.
 * @returns {Promise<Object|null>} Registro insertado con sus datos relacionados.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function createRecordatorio(userId, recordatorio) {
  const [result] = await pool.execute(
    `INSERT INTO recordatorio (id_tarea, mensaje, fecha_hora, canal, leido)
     VALUES (?, ?, ?, ?, ?)`,
    [
      recordatorio.tareaId,
      recordatorio.mensaje,
      recordatorio.fechaHora,
      recordatorio.canal,
      recordatorio.leido ? 1 : 0
    ]
  );

  return findByIdAndUserId(result.insertId, userId);
}

/**
 * Actualiza los campos enviados de un recordatorio propiedad del usuario.
 *
 * @param {string|number} id - ID del recordatorio que se cambiará.
 * @param {string|number} userId - ID del usuario autenticado.
 * @param {Object} partialRecordatorio - Campos ya validados que se actualizarán.
 * @returns {Promise<Object|null>} Registro actualizado con sus datos relacionados.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function updateRecordatorio(id, userId, partialRecordatorio) {
  const fields = [];
  const params = [];

  if (partialRecordatorio.tareaId !== undefined) {
    fields.push("r.id_tarea = ?");
    params.push(partialRecordatorio.tareaId);
  }

  if (partialRecordatorio.mensaje !== undefined) {
    fields.push("r.mensaje = ?");
    params.push(partialRecordatorio.mensaje);
  }

  if (partialRecordatorio.fechaHora !== undefined) {
    fields.push("r.fecha_hora = ?");
    params.push(partialRecordatorio.fechaHora);
  }

  if (partialRecordatorio.canal !== undefined) {
    fields.push("r.canal = ?");
    params.push(partialRecordatorio.canal);
  }

  if (partialRecordatorio.leido !== undefined) {
    fields.push("r.leido = ?");
    params.push(partialRecordatorio.leido ? 1 : 0);
  }

  if (fields.length === 0) {
    return findByIdAndUserId(id, userId);
  }

  // Esta sentencia solo modifica columnas de recordatorio; tarea y materia se usan para autorización.
  params.push(id, userId);
  await pool.execute(
    `UPDATE recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     SET ${fields.join(", ")}
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    params
  );

  // Se vuelve a leer aunque el valor enviado sea igual al actual; MySQL puede reportar 0 cambios.
  return findByIdAndUserId(id, userId);
}

/**
 * Elimina solo el recordatorio indicado cuando pertenece al usuario.
 *
 * @param {string|number} id - ID del recordatorio que se eliminará.
 * @param {string|number} userId - ID del usuario autenticado.
 * @returns {Promise<boolean>} true si se eliminó una fila.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function deleteRecordatorio(id, userId) {
  const [result] = await pool.execute(
    `DELETE r
     FROM recordatorio r
     INNER JOIN tarea t ON t.id_tarea = r.id_tarea
     INNER JOIN materia m ON m.id_materia = t.id_materia
     WHERE r.id_recordatorio = ? AND m.id_usuario = ?`,
    [id, userId]
  );

  return result.affectedRows > 0;
}
