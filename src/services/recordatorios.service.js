import * as recordatoriosRepository from "../repositories/recordatorios.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Obtiene los recordatorios del usuario y prepara la información de paginación.
 *
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @param {Object} filters - Filtros validados recibidos desde el controlador.
 * @returns {Promise<{data: Object[], meta: Object}>} Registros y metadatos de página.
 * @throws {Error} Propaga errores de base de datos generados por el repositorio.
 */
export async function listRecordatorios(userId, filters) {
  const { recordatorios, total } = await recordatoriosRepository.findAllByUserId(userId, filters);

  return {
    data: recordatorios,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Obtiene un recordatorio y confirma que esté asociado a una tarea del usuario.
 *
 * @param {string|number} id - ID del recordatorio.
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @returns {Promise<Object>} Recordatorio encontrado.
 * @throws {HttpError} Lanza 404 cuando no existe o pertenece a otro usuario.
 */
export async function getRecordatorioById(id, userId) {
  const recordatorio = await recordatoriosRepository.findByIdAndUserId(id, userId);

  if (!recordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "El recordatorio no fue encontrado.");
  }

  return recordatorio;
}

/**
 * Comprueba la propiedad de la tarea antes de asociarla al recordatorio.
 *
 * @param {string|number} tareaId - ID de la tarea que se asociará.
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @returns {Promise<void>} No devuelve valor cuando la tarea pertenece al usuario.
 * @throws {HttpError} Lanza 404 si la tarea no existe para ese usuario.
 */
async function ensureTareaBelongsToUser(tareaId, userId) {
  const belongsToUser = await recordatoriosRepository.tareaBelongsToUser(tareaId, userId);

  if (!belongsToUser) {
    throw new HttpError(404, "TAREA_NOT_FOUND", "La tarea no fue encontrada para este usuario.");
  }
}

/**
 * Crea un recordatorio luego de verificar el acceso a la tarea relacionada.
 *
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @param {Object} recordatorio - Campos validados del nuevo recordatorio.
 * @returns {Promise<Object|null>} Recordatorio creado.
 * @throws {HttpError} Lanza 404 si la tarea no pertenece al usuario.
 */
export async function createRecordatorio(userId, recordatorio) {
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  return recordatoriosRepository.createRecordatorio(userId, recordatorio);
}

/**
 * Reemplaza los campos editables de un recordatorio propiedad del usuario.
 *
 * @param {string|number} id - ID del recordatorio que se reemplazará.
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @param {Object} recordatorio - Conjunto completo de campos validados.
 * @returns {Promise<Object|null>} Recordatorio actualizado.
 * @throws {HttpError} Lanza 404 si el recordatorio o su tarea no pertenecen al usuario.
 */
export async function replaceRecordatorio(id, userId, recordatorio) {
  await getRecordatorioById(id, userId);
  await ensureTareaBelongsToUser(recordatorio.tareaId, userId);
  const replacedRecordatorio = await recordatoriosRepository.updateRecordatorio(id, userId, recordatorio);

  if (!replacedRecordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "El recordatorio no fue encontrado.");
  }

  return replacedRecordatorio;
}

/**
 * Actualiza los campos indicados de un recordatorio propiedad del usuario.
 *
 * @param {string|number} id - ID del recordatorio que se actualizará.
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @param {Object} partialRecordatorio - Campos validados que se cambiarán.
 * @returns {Promise<Object|null>} Recordatorio actualizado.
 * @throws {HttpError} Lanza 404 si el recordatorio o la nueva tarea no pertenecen al usuario.
 */
export async function updateRecordatorio(id, userId, partialRecordatorio) {
  await getRecordatorioById(id, userId);

  if (partialRecordatorio.tareaId !== undefined) {
    await ensureTareaBelongsToUser(partialRecordatorio.tareaId, userId);
  }

  const updatedRecordatorio = await recordatoriosRepository.updateRecordatorio(id, userId, partialRecordatorio);

  if (!updatedRecordatorio) {
    throw new HttpError(404, "RECORDATORIO_NOT_FOUND", "El recordatorio no fue encontrado.");
  }

  return updatedRecordatorio;
}

/**
 * Elimina un recordatorio propiedad del usuario.
 *
 * @param {string|number} id - ID del recordatorio que se eliminará.
 * @param {string|number} userId - Identificador del usuario autenticado.
 * @returns {Promise<void>} No devuelve contenido después de eliminar.
 * @throws {HttpError} Lanza 404 si el recordatorio no existe para ese usuario.
 */
export async function removeRecordatorio(id, userId) {
  await getRecordatorioById(id, userId);
  await recordatoriosRepository.deleteRecordatorio(id, userId);
}
