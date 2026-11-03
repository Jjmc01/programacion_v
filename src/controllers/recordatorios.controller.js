import * as recordatoriosService from "../services/recordatorios.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";
import {
  validateCreateRecordatorio,
  validatePatchRecordatorio,
  validateRecordatorioId,
  validateRecordatorioListQuery,
  validateReplaceRecordatorio
} from "../validators/recordatorios.validator.js";

/**
 * Lista los recordatorios del usuario autenticado con filtros y paginación.
 *
 * @param {import("express").Request} request - Solicitud HTTP con filtros en query y usuario en request.user.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Lista de resultados y metadatos de página.
 */
export async function listRecordatorios(request, response, next) {
  try {
    const filters = validateRecordatorioListQuery(request.query);
    const result = await recordatoriosService.listRecordatorios(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * Consulta un recordatorio por ID y verifica que pertenezca al usuario actual.
 *
 * @param {import("express").Request} request - Solicitud con el ID en params.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Recordatorio encontrado.
 */
export async function getRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const recordatorio = await recordatoriosService.getRecordatorioById(id, request.user.id);
    return sendSuccess(response, recordatorio);
  } catch (error) {
    return next(error);
  }
}

/**
 * Crea un recordatorio asociado a una tarea del usuario autenticado.
 *
 * @param {import("express").Request} request - Solicitud con los campos en body.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Recordatorio creado con estado HTTP 201.
 */
export async function createRecordatorio(request, response, next) {
  try {
    const payload = validateCreateRecordatorio(request.body);
    const recordatorio = await recordatoriosService.createRecordatorio(request.user.id, payload);
    return sendSuccess(response, recordatorio, 201);
  } catch (error) {
    return next(error);
  }
}

/**
 * Reemplaza todos los campos editables de un recordatorio del usuario.
 *
 * @param {import("express").Request} request - Solicitud con ID en params y campos completos en body.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Recordatorio reemplazado.
 */
export async function replaceRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validateReplaceRecordatorio(request.body);
    const recordatorio = await recordatoriosService.replaceRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio);
  } catch (error) {
    return next(error);
  }
}

/**
 * Actualiza solo los campos enviados para un recordatorio del usuario.
 *
 * @param {import("express").Request} request - Solicitud con ID en params y cambios parciales en body.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Recordatorio actualizado.
 */
export async function updateRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    const payload = validatePatchRecordatorio(request.body);
    const recordatorio = await recordatoriosService.updateRecordatorio(id, request.user.id, payload);
    return sendSuccess(response, recordatorio);
  } catch (error) {
    return next(error);
  }
}

/**
 * Elimina un recordatorio del usuario autenticado sin alterar sus tareas o materias.
 *
 * @param {import("express").Request} request - Solicitud cuyo parámetro id identifica el recordatorio.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Middleware que recibe errores.
 * @returns {Promise<import("express").Response|void>} Respuesta HTTP 204 sin contenido.
 */
export async function deleteRecordatorio(request, response, next) {
  try {
    const id = validateRecordatorioId(request.params.id);
    await recordatoriosService.removeRecordatorio(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}
