import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

// Esta función actúa como una capa de servicio entre la lógica de negocio y el repositorio.
// Su tarea principal es pedirle a la base de datos la lista de materias del usuario indicado,
// y luego devolver esa información en un formato listo para la capa HTTP o la API que la consumirá.
// Es decir, el repositorio se ocupa de consultar SQL, y este servicio se encarga de preparar la
// respuesta final con metadata útil para la paginación y la interfaz.
/**
 * Recupera las materias del usuario y prepara los datos de paginación para el controlador.
 *
 * @async
 * @function listMaterias
 * @param {string|number} userId - Identificador único del usuario propietario de las materias.
 * @param {Object} filters - Filtros ya validados para búsqueda, estado, orden y paginación.
 * @param {boolean} [filters.activa] - Limita los resultados a materias activas o inactivas.
 * @param {string} [filters.search] - Texto que se busca en el nombre o código de la materia.
 * @param {string} [filters.sort] - Campo permitido por el repositorio para ordenar.
 * @param {string} [filters.order] - Dirección del ordenamiento: asc o desc.
 * @param {number} filters.page - Número de página solicitado.
 * @param {number} filters.limit - Cantidad máxima de materias por página.
 * @returns {Promise<{data: Object[], meta: {page: number, limit: number, total: number, pages: number}}>} Materias y metadatos de paginación.
 * @throws {Error} Propaga errores de base de datos generados por el repositorio.
 */
export async function listMaterias(userId, filters) {
  // Primero se llama al repositorio con el id del usuario y los filtros recibidos desde la petición.
  // Por ejemplo: búsqueda por nombre/código, filtro de activas/inactivas, orden, página y límite.
  const { materias, total } = await materiasRepository.findAllByUserId(userId, filters);

  // Luego se construye el objeto de respuesta para la API.
  // "data" contiene la colección de materias, y "meta" aporta información adicional necesaria
  // para saber en qué página va el cliente, cuántos resultados hay en total y cuántas páginas existen.
  return {
    data: materias,
    meta: {
      page: filters.page,
      limit: filters.limit,
      total,
      // Math.ceil redondea hacia arriba para que el número de páginas no se pierda
      // cuando el total no sea divisible exactamente por el límite.
      pages: Math.ceil(total / filters.limit)
    }
  };
}

/**
 * Busca una materia por ID y verifica que pertenezca al usuario indicado.
 *
 * @async
 * @function getMateriaById
 * @param {string|number} id - Identificador de la materia que se desea consultar.
 * @param {string|number} userId - Identificador único del usuario propietario.
 * @returns {Promise<Object>} Objeto con los datos de la materia encontrada.
 * @throws {HttpError} Lanza un error 404 si la materia no existe o no pertenece al usuario.
 */
export async function getMateriaById(id, userId) {
  const materia = await materiasRepository.findByIdAndUserId(id, userId);
  if (!materia) {
    throw new HttpError(404, "MATERIA_NOT_FOUND", "Materia no fue encontrada.");
  }
  return materia;
}



/**
 * Valida los campos únicos y crea una materia para el usuario indicado.
 *
 * @async
 * @function createMateria
 * @param {string|number} userId - Identificador único del usuario propietario de la materia.
 * @param {Object} materia - Datos validados de la nueva materia.
 * @param {string} materia.nombre - Nombre de la materia.
 * @param {string} materia.codigo - Código único de la materia para el usuario.
 * @param {string} materia.color - Color hexadecimal de la materia.
 * @param {number} materia.creditos - Número de créditos de la materia.
 * @param {boolean} materia.activa - Indica si la materia se crea activa.
 * @returns {Promise<Object>} Materia creada y leída nuevamente desde la base de datos.
 * @throws {HttpError} Lanza un error 409 si el usuario ya tiene ese código o nombre.
 */
export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}



/**
 * Valida que el código y el nombre de una materia sean únicos para un usuario específico.
 *
 * @async
 * @function ensureUniqueFields
 * @param {string|number} userId - Identificador único del usuario dueño de la materia.
 * @param {Object} materia - Objeto que contiene los datos de la materia a validar.
 * @param {string} [materia.codigo] - Código identificador de la materia (opcional).
 * @param {string} [materia.nombre] - Nombre de la materia (opcional).
 * @param {string|number} [excludeId] - ID de una materia existente a excluir de la validación, útil al actualizar.
 * @returns {Promise<void>} No retorna ningún valor si las validaciones son exitosas.
 * @throws {HttpError} Código 409 (DUPLICATE_CODE) si el código ya está registrado para el usuario.
 * @throws {HttpError} Código 409 (DUPLICATE_NAME) si el nombre ya está registrado para el usuario.
 */
async function ensureUniqueFields(userId, materia, excludeId) {
  if (materia.codigo) {
    const duplicatedCode = await materiasRepository.existsByCode(userId, materia.codigo, excludeId);

    if (duplicatedCode) {
      throw new HttpError(409, "DUPLICATE_CODE", "Ya existe una materia con ese código.");
    }
  }

  if (materia.nombre) {
    const duplicatedName = await materiasRepository.existsByName(userId, materia.nombre, excludeId);

    if (duplicatedName) {
      throw new HttpError(409, "DUPLICATE_NAME", "Ya existe una materia con ese nombre.");
    }
  }
}

/**
 * Reemplaza todos los datos editables de una materia después de verificar propiedad y unicidad.
 *
 * @async
 * @function replaceMateria
 * @param {string|number} id - Identificador de la materia que se reemplazará.
 * @param {string|number} userId - Identificador único del usuario propietario.
 * @param {Object} materia - Conjunto completo de campos de la materia reemplazada.
 * @returns {Promise<Object>} Materia actualizada.
 * @throws {HttpError} Lanza 404 si la materia no pertenece al usuario o 409 si hay campos duplicados.
 */
export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.patchMateria(id, userId, materia);
}

/**
 * Actualiza solo los campos enviados para una materia del usuario indicado.
 *
 * @async
 * @function updateMateria
 * @param {string|number} id - Identificador de la materia que se actualizará.
 * @param {string|number} userId - Identificador único del usuario propietario.
 * @param {Object} partialMateria - Campos opcionales de la materia que se desean modificar.
 * @returns {Promise<Object>} Materia actualizada.
 * @throws {HttpError} Lanza 404 si la materia no pertenece al usuario o 409 si hay campos duplicados.
 */
export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

/**
 * Comprueba la propiedad de una materia y solicita su eliminación al repositorio.
 *
 * @async
 * @function removeMateria
 * @param {string|number} id - Identificador de la materia que se eliminará.
 * @param {string|number} userId - Identificador único del usuario propietario.
 * @returns {Promise<void>} No devuelve contenido después de completar la eliminación.
 * @throws {HttpError} Lanza un error 404 si la materia no existe para ese usuario.
 * @throws {Error} Propaga errores de base de datos generados durante la eliminación.
 */
export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}

