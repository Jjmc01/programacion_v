import * as materiasService from "../services/materias.service.js";
import { sendNoContent, sendSuccess } from "../utils/api-response.js";

import {
  validateCreateMateria,
  validateMateriaId,
  validateMateriaListQuery,
  validatePatchMateria
} from "../validators/materias.validator.js";


/**
 * Obtiene la lista paginada de materias del usuario autenticado aplicando los filtros recibidos.
 *
 * @async
 * @function listMaterias
 * @param {import("express").Request} request - Solicitud HTTP con filtros en query y usuario en request.user.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con las materias y los metadatos de paginación.
 * @throws {HttpError} Propaga errores de validación o de consulta para que los gestione el middleware.
 */
export async function listMaterias(request, response, next) {
  try {
    const filters = validateMateriaListQuery(request.query);
    const result = await materiasService.listMaterias(request.user.id, filters);
    return sendSuccess(response, result.data, 200, result.meta);
  } catch (error) {
    return next(error);
  }
}

/**
 * Obtiene una materia por su identificador y comprueba que pertenezca al usuario autenticado.
 *
 * @async
 * @function getMaterias
 * @param {import("express").Request} request - Solicitud HTTP cuyo parámetro id identifica la materia.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con los datos de la materia encontrada.
 * @throws {HttpError} Propaga un error 400 si el ID no es válido o 404 si la materia no pertenece al usuario.
 */
export async function getMaterias(request, response, next){
  try{
    const  id  = validateMateriaId(request.params.id);
    const result = await materiasService.getMateriaById(id, request.user.id);
    return sendSuccess(response, result);
  } catch(error){
    return next(error);
  }
}


/**
 * Valida y crea una materia para el usuario autenticado.
 *
 * @async
 * @function createMateria
 * @param {import("express").Request} request - Solicitud HTTP con los datos de la materia en el cuerpo.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con la materia creada y estado HTTP 201.
 * @throws {HttpError} Propaga errores de validación o un conflicto 409 si el usuario ya tiene el código o nombre.
 */
export async function createMateria(request, response, next) {
  try {
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.createMateria(request.user.id, payload);
    return sendSuccess(response, materia, 201);
  } catch (error) {
    return next(error);
  }
}


/**
 * Reemplaza los datos de una materia existente propiedad del usuario autenticado.
 *
 * @async
 * @function replaceMateria
 * @param {import("express").Request} request - Solicitud HTTP con el ID en params y los datos completos en body.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con la materia reemplazada.
 * @throws {HttpError} Propaga errores de validación, 404 si no existe para el usuario o 409 por duplicados.
 */
export async function replaceMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validateCreateMateria(request.body);
    const materia = await materiasService.replaceMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

/**
 * Actualiza parcialmente una materia existente propiedad del usuario autenticado.
 *
 * @async
 * @function updateMateria
 * @param {import("express").Request} request - Solicitud HTTP con el ID en params y los campos a cambiar en body.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con la materia actualizada.
 * @throws {HttpError} Propaga errores de validación, 404 si no existe para el usuario o 409 por duplicados.
 */
export async function updateMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const payload = validatePatchMateria(request.body);
    const materia = await materiasService.updateMateria(id, request.user.id, payload);
    return sendSuccess(response, materia);
  } catch (error) {
    return next(error);
  }
}

/**
 * Elimina una materia propiedad del usuario autenticado.
 *
 * @async
 * @function deleteMateria
 * @param {import("express").Request} request - Solicitud HTTP cuyo parámetro id identifica la materia.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con HTTP 204 sin cuerpo si la eliminación termina.
 * @throws {HttpError} Propaga un error 400 si el ID no es válido o 404 si la materia no pertenece al usuario.
 */
export async function deleteMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    await materiasService.removeMateria(id, request.user.id);
    return sendNoContent(response);
  } catch (error) {
    return next(error);
  }
}

/**
 * Obtiene las tareas de una materia que pertenece al usuario autenticado.
 *
 * @async
 * @function listTareasByMateria
 * @param {import("express").Request} request - Solicitud con el ID de materia en params y el usuario en request.user.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con las tareas encontradas en estado HTTP 200.
 * @throws {HttpError} Propaga errores de validación o de consulta para que los gestione el middleware.
 */
export async function listTareasByMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const tareas = await materiasService.listTareasByMateria(id, request.user.id);

    return sendSuccess(response, tareas);
  } catch (error) {
    return next(error);
  }
}

/**
 * Obtiene los eventos de una materia que pertenece al usuario autenticado.
 *
 * @async
 * @function listEventosByMateria
 * @param {import("express").Request} request - Solicitud con el ID de materia en params y el usuario en request.user.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con los eventos encontrados en estado HTTP 200.
 * @throws {HttpError} Propaga errores de validación o de consulta para que los gestione el middleware.
 */
export async function listEventosByMateria(request, response, next) {
  try {
    const id = validateMateriaId(request.params.id);
    const eventos = await materiasService.listEventosByMateria(id, request.user.id);

    return sendSuccess(response, eventos);
  } catch (error) {
    return next(error);
  }
}

