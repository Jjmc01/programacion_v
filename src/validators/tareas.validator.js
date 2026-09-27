import { validateMateriaId } from "./materias.validator.js";

/**
 * Valida el parámetro materiaId recibido en la ruta de consulta de tareas.
 *
 * @function validateTareasByMateriaParams
 * @param {Object} params - Parámetros de ruta entregados por Express.
 * @param {string|number} params.materiaId - Identificador de la materia cuyas tareas se consultarán.
 * @returns {number} Identificador entero positivo de la materia.
 * @throws {HttpError} Propaga un error 400 con código INVALID_ID si el identificador no es válido.
 */
export function validateTareasByMateriaParams(params) {
  return validateMateriaId(params.materiaId);
}
