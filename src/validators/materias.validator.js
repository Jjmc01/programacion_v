import { HttpError } from "../utils/http-error.js";

/**
 * Convierte un booleano o su representación en texto a true o false.
 *
 * @function parseBoolean
 * @param {boolean|string|undefined} value - Valor booleano o texto true/false recibido.
 * @returns {boolean|undefined} Booleano convertido; undefined si no se envió un valor.
 * @throws {HttpError} Lanza un error 422 si el valor no representa true ni false.
 */
function parseBoolean(value) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  const normalized = String(value).toLowerCase();

  if (normalized === "true") {
    return true;
  }

  if (normalized === "false") {
    return false;
  }

  throw new HttpError(422, "VALIDATION_ERROR", "El filtro 'activa' debe ser true o false.");
}

/**
 * Convierte un valor a entero y verifica que no sea negativo.
 *
 * @function parsePositiveInteger
 * @param {string|number|null|undefined} value - Valor numérico que se desea validar.
 * @param {string} fieldName - Nombre del campo usado en el mensaje de error.
 * @returns {number|null} Entero validado o null si el valor está ausente o vacío.
 * @throws {HttpError} Lanza un error 422 cuando el valor no es un entero mayor o igual a cero.
 */
function parsePositiveInteger(value, fieldName) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero positivo o cero.`);
  }

  return parsed;
}

/**
 * Verifica que un campo sea texto no vacío y elimina espacios al inicio y al final.
 *
 * @function normalizeString
 * @param {*} value - Valor recibido para el campo.
 * @param {string} fieldName - Nombre del campo usado en el mensaje de error.
 * @returns {string} Texto validado y sin espacios exteriores.
 * @throws {HttpError} Lanza un error 422 si el valor no es texto o está vacío.
 */
function normalizeString(value, fieldName) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' es obligatorio.`);
  }

  return value.trim();
}

/**
 * Comprueba que el color esté escrito como hexadecimal RGB de seis dígitos.
 *
 * @function validateColor
 * @param {string} color - Color recibido, con formato esperado #RRGGBB.
 * @returns {void} No devuelve valor cuando el color es válido.
 * @throws {HttpError} Lanza un error 422 cuando el color no tiene el formato esperado.
 */
function validateColor(color) {
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'color' debe tener formato hexadecimal #RRGGBB.");
  }
}

/**
 * Valida y normaliza los parámetros de búsqueda, orden y paginación de materias.
 *
 * @function validateMateriaListQuery
 * @param {Object} query - Objeto request.query recibido desde Express.
 * @param {string} [query.page] - Página solicitada; por defecto 1.
 * @param {string} [query.limit] - Máximo de resultados; por defecto 20 y permite de 1 a 100.
 * @param {string} [query.activa] - Filtro opcional true o false.
 * @param {string} [query.search] - Texto opcional para buscar nombre o código.
 * @param {string} [query.sort] - Campo por el cual ordenar.
 * @param {string} [query.order] - Sentido del ordenamiento.
 * @returns {{activa: boolean|undefined, search: string, sort: string, order: string, page: number, limit: number}} Filtros normalizados.
 * @throws {HttpError} Lanza un error 422 si los valores booleanos o la paginación son inválidos.
 */
export function validateMateriaListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  return {
    activa: parseBoolean(query.activa),
    search: typeof query.search === "string" ? query.search.trim() : "",
    sort: query.sort,
    order: query.order,
    page,
    limit
  };
}

/**
 * Convierte y valida el identificador de una materia recibido en una ruta.
 *
 * @function validateMateriaId
 * @param {string|number} id - ID de materia recibido desde request.params.
 * @returns {number} Identificador entero positivo validado.
 * @throws {HttpError} Lanza un error 400 con código INVALID_ID si el ID no es un entero positivo.
 */
export function validateMateriaId(id) {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador de materia no es válido.");
  }

  return parsedId;
}

/**
 * Valida y construye el objeto completo requerido para crear o reemplazar una materia.
 *
 * @function validateCreateMateria
 * @param {Object} body - Cuerpo JSON enviado en la solicitud.
 * @param {string} body.nombre - Nombre obligatorio de la materia.
 * @param {string} body.codigo - Código obligatorio de la materia.
 * @param {string} body.color - Color obligatorio en formato #RRGGBB.
 * @param {string|number|null|undefined} body.creditos - Cantidad de créditos, entero mayor o igual a cero; si se omite, se normaliza a null.
 * @param {boolean|string} [body.activa=true] - Estado de actividad opcional.
 * @returns {{nombre: string, codigo: string, color: string, creditos: number|null, activa: boolean}} Datos normalizados de la materia.
 * @throws {HttpError} Lanza un error 422 si faltan campos o algún valor no cumple las reglas.
 */
export function validateCreateMateria(body) {
  const nombre = normalizeString(body.nombre, "nombre");
  const codigo = normalizeString(body.codigo, "codigo");
  const color = normalizeString(body.color, "color");
  const creditos = parsePositiveInteger(body.creditos, "creditos");
  const activa = body.activa === undefined ? true : parseBoolean(body.activa);

  validateColor(color);

  return {
    nombre,
    codigo,
    color,
    creditos,
    activa
  };
}

/**
 * Valida los campos opcionales enviados para actualizar parcialmente una materia.
 *
 * @function validatePatchMateria
 * @param {Object} body - Cuerpo JSON con uno o más campos que se desean cambiar.
 * @param {string} [body.nombre] - Nuevo nombre de la materia.
 * @param {string} [body.codigo] - Nuevo código de la materia.
 * @param {string} [body.color] - Nuevo color en formato #RRGGBB.
 * @param {string|number} [body.creditos] - Nueva cantidad de créditos, entero mayor o igual a cero.
 * @param {boolean|string} [body.activa] - Nuevo estado activo/inactivo.
 * @returns {Object} Objeto con solo los campos enviados, validados y normalizados.
 * @throws {HttpError} Lanza un error 422 si un valor es inválido o si no se envió ningún campo.
 */
export function validatePatchMateria(body) {
  const payload = {};

  if (body.nombre !== undefined) {
    payload.nombre = normalizeString(body.nombre, "nombre");
  }

  if (body.codigo !== undefined) {
    payload.codigo = normalizeString(body.codigo, "codigo");
  }

  if (body.color !== undefined) {
    payload.color = normalizeString(body.color, "color");
    validateColor(payload.color);
  }

  if (body.creditos !== undefined) {
    payload.creditos = parsePositiveInteger(body.creditos, "creditos");
  }

  if (body.activa !== undefined) {
    payload.activa = parseBoolean(body.activa);
  }

  if (Object.keys(payload).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return payload;
}
