import * as materiasRepository from "../repositories/materias.repositorio.js";
import { HttpError } from "../utils/http-error.js";

// Esta función actúa como una capa de servicio entre la lógica de negocio y el repositorio.
// Su tarea principal es pedirle a la base de datos la lista de materias del usuario indicado,
// y luego devolver esa información en un formato listo para la capa HTTP o la API que la consumirá.
// Es decir, el repositorio se ocupa de consultar SQL, y este servicio se encarga de preparar la
// respuesta final con metadata útil para la paginación y la interfaz.
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

export async function getMateriaById(id, userId) {
const materia = await materiasRepository.findByIdAndUserId(id, userId);
  if (!materia) {
    throw new HttpError(404, "Materia no fue encontrada");
  }
  return materia;
}



export async function createMateria(userId, materia) {
  await ensureUniqueFields(userId, materia);
  return materiasRepository.createMateria(userId, materia);
}



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

export async function replaceMateria(id, userId, materia) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, materia, id);
  return materiasRepository.updateMateria(id, userId, materia);
}

export async function updateMateria(id, userId, partialMateria) {
  await getMateriaById(id, userId);
  await ensureUniqueFields(userId, partialMateria, id);
  return materiasRepository.patchMateria(id, userId, partialMateria);
}

export async function removeMateria(id, userId) {
  await getMateriaById(id, userId);
  await materiasRepository.deleteMateria(id, userId);
}

