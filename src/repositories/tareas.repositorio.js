import { pool } from "../config/database.js";

/**
 * Convierte una fila de la tabla tarea al formato de objeto utilizado por la API.
 *
 * @function mapTareaRow
 * @param {Object} row - Fila devuelta por MySQL con los alias definidos en la consulta.
 * @returns {Object} Tarea con propiedades en camelCase.
 */
function mapTareaRow(row) {
  return {
    id: row.id,
    materiaId: row.materiaId,
    titulo: row.titulo,
    descripcion: row.descripcion,
    fechaEntrega: row.fechaEntrega,
    horaEntrega: row.horaEntrega,
    prioridad: row.prioridad,
    estado: row.estado,
    cargaEstimadaMinutos: row.cargaEstimadaMinutos,
    porcentajeAvance: row.porcentajeAvance,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

/**
 * Consulta las tareas de una materia únicamente si esta pertenece al usuario indicado.
 *
 * @async
 * @function findAllByMateriaAndUserId
 * @param {string|number} materiaId - Identificador de la materia.
 * @param {string|number} userId - Identificador del usuario propietario de la materia.
 * @returns {Promise<Object[]>} Lista de tareas ordenada por fecha, hora de entrega e ID.
 * @throws {Error} Propaga errores generados por la consulta de MySQL.
 */
export async function findAllByMateriaAndUserId(materiaId, userId) {
  const [rows] = await pool.execute(
    `SELECT
       t.id_tarea AS id,
       t.id_materia AS materiaId,
       t.titulo,
       t.descripcion,
       t.fecha_entrega AS fechaEntrega,
       t.hora_entrega AS horaEntrega,
       t.prioridad,
       t.estado,
       t.carga_estimada_minutos AS cargaEstimadaMinutos,
       t.porcentaje_avance AS porcentajeAvance,
       t.created_at AS createdAt,
       t.updated_at AS updatedAt
     FROM tarea AS t
     INNER JOIN materia AS m
       ON m.id_materia = t.id_materia
     WHERE t.id_materia = ?
       AND m.id_usuario = ?
     ORDER BY t.fecha_entrega ASC, t.hora_entrega ASC, t.id_tarea ASC`,
    [materiaId, userId]
  );

  return rows.map(mapTareaRow);
}
