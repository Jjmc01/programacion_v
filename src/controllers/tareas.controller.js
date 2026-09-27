import * as tareasService from "../services/tareas.service.js";
import { sendSuccess } from "../utils/api-response.js";
import { validateTareasByMateriaParams } from "../validators/tareas.validator.js";

/**
 * Devuelve las tareas de una materia que pertenece al usuario de la solicitud.
 *
 * @async
 * @function listTareasByMateria
 * @param {import("express").Request} request - Solicitud con materiaId en params y el usuario en request.user.
 * @param {import("express").Response} response - Respuesta HTTP de Express.
 * @param {import("express").NextFunction} next - Función para delegar errores al middleware de errores.
 * @returns {Promise<import("express").Response|void>} Responde con las tareas y estado HTTP 200.
 * @throws {HttpError} Propaga errores de validación o un error 404 si la materia no pertenece al usuario.
 */
export async function listTareasByMateria(request, response, next) {
  try {
    const materiaId = validateTareasByMateriaParams(request.params);
    const userId = request.user.id;
    const tareas = await tareasService.listTareasByMateria(materiaId, userId);

    return sendSuccess(response, tareas);
  } catch (error) {
    return next(error);
  }
}
