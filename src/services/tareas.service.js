import * as materiasRepository from "../repositories/materias.repositorio.js";
import * as tareasRepository from "../repositories/tareas.repositorio.js";
import { HttpError } from "../utils/http-error.js";

/**
 * Obtiene las tareas de una materia y comprueba que la materia pertenezca al usuario.
 *
 * @async
 * @function listTareasByMateria
 * @param {string|number} materiaId - Identificador de la materia cuyas tareas se consultarán.
 * @param {string|number} userId - Identificador del usuario propietario de la materia.
 * @returns {Promise<Object[]>} Tareas encontradas; devuelve un arreglo vacío si la materia no tiene tareas.
 * @throws {HttpError} Lanza un error 404 si la materia no existe o no pertenece al usuario.
 * @throws {Error} Propaga errores de base de datos generados por los repositorios.
 */
export async function listTareasByMateria(materiaId, userId) {
  const materia = await materiasRepository.findByIdAndUserId(materiaId, userId);

  if (!materia) {
    throw new HttpError(404, "MATERIA_NOT_FOUND", "Materia no fue encontrada.");
  }

  return tareasRepository.findAllByMateriaAndUserId(materiaId, userId);
}
