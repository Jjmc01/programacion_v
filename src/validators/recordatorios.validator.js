import { HttpError } from "../utils/http-error.js";

const reminderChannels = ["in_app", "email"];

/**
 * Comprueba que el cuerpo de la petición sea un objeto JSON antes de leer sus campos.
 *
 * @param {*} body - Cuerpo recibido por Express.
 * @returns {Object} Cuerpo listo para validar.
 * @throws {HttpError} Lanza un error 422 si el cuerpo no es un objeto.
 */
function requireObjectBody(body) {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El cuerpo de la solicitud debe ser un objeto JSON.");
  }

  return body;
}

/**
 * Convierte un identificador recibido a entero positivo.
 *
 * @param {string|number} value - Identificador que se desea validar.
 * @param {string} fieldName - Nombre del campo para el mensaje de error.
 * @returns {number} Identificador entero validado.
 * @throws {HttpError} Lanza un error 422 si el valor no es un entero positivo.
 */
function parsePositiveId(value, fieldName) {
  const parsed = Number(value);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser un entero mayor o igual a 1.`);
  }

  return parsed;
}

/**
 * Valida y normaliza la fecha y hora local que se guarda en DATETIME.
 *
 * Se aceptan los formatos "YYYY-MM-DD HH:mm:ss" y "YYYY-MM-DDTHH:mm:ss".
 *
 * @param {*} value - Fecha y hora recibida en el cuerpo de la petición.
 * @param {string} fieldName - Nombre del campo para el mensaje de error.
 * @returns {string} Fecha normalizada como "YYYY-MM-DD HH:mm:ss".
 * @throws {HttpError} Lanza un error 422 si la fecha no existe o no tiene el formato esperado.
 */
function parseDateTime(value, fieldName) {
  if (typeof value !== "string") {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser una fecha y hora válida.`);
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/.exec(value.trim());

  if (!match) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe usar el formato YYYY-MM-DD HH:mm:ss.`);
  }

  const [, yearText, monthText, dayText, hourText, minuteText, secondText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const second = Number(secondText);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  if (
    year < 1000 || year > 9999 ||
    month < 1 || month > 12 ||
    day < 1 || day > daysInMonth ||
    hour > 23 || minute > 59 || second > 59
  ) {
    throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' no representa una fecha y hora existente.`);
  }

  return `${yearText}-${monthText}-${dayText} ${hourText}:${minuteText}:${secondText}`;
}

/**
 * Valida el canal permitido por la columna enum de recordatorio.
 *
 * @param {*} value - Canal recibido.
 * @returns {string} Canal validado: in_app o email.
 * @throws {HttpError} Lanza un error 422 si el canal no está permitido.
 */
function parseChannel(value) {
  if (typeof value !== "string" || !reminderChannels.includes(value)) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'canal' debe ser 'in_app' o 'email'.");
  }

  return value;
}

/**
 * Convierte un valor JSON o de query string en booleano.
 *
 * @param {*} value - Booleano o texto true/false recibido.
 * @param {string} fieldName - Nombre del campo para el mensaje de error.
 * @returns {boolean} Valor booleano validado.
 * @throws {HttpError} Lanza un error 422 si el valor no representa true ni false.
 */
function parseBoolean(value, fieldName) {
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

  throw new HttpError(422, "VALIDATION_ERROR", `El campo '${fieldName}' debe ser true o false.`);
}

/**
 * Valida los filtros, el orden y la paginación del listado de recordatorios.
 *
 * @param {Object} query - Parámetros recibidos en request.query.
 * @returns {Object} Filtros normalizados para el servicio y el repositorio.
 * @throws {HttpError} Lanza un error 422 si algún filtro o dato de paginación es inválido.
 */
export function validateRecordatorioListQuery(query) {
  const page = Number(query.page ?? 1);
  const limit = Number(query.limit ?? 20);

  if (!Number.isInteger(page) || page < 1) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'page' debe ser un entero mayor o igual a 1.");
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'limit' debe ser un entero entre 1 y 100.");
  }

  if (query.search !== undefined && typeof query.search !== "string") {
    throw new HttpError(422, "VALIDATION_ERROR", "El parámetro 'search' debe ser texto.");
  }

  return {
    page,
    limit,
    leido: query.leido === undefined ? undefined : parseBoolean(query.leido, "leido"),
    canal: query.canal === undefined ? undefined : parseChannel(query.canal),
    tareaId: query.tareaId === undefined ? undefined : parsePositiveId(query.tareaId, "tareaId"),
    search: query.search?.trim() ?? "",
    sort: typeof query.sort === "string" ? query.sort : undefined,
    order: typeof query.order === "string" ? query.order : undefined
  };
}

/**
 * Valida el identificador de recordatorio recibido en la ruta.
 *
 * @param {string|number} id - ID recibido desde request.params.
 * @returns {number} Identificador entero positivo validado.
 * @throws {HttpError} Lanza un error 400 si el ID no es válido.
 */
export function validateRecordatorioId(id) {
  const parsed = Number(id);

  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new HttpError(400, "INVALID_ID", "El identificador del recordatorio no es válido.");
  }

  return parsed;
}

/**
 * Valida todos los campos editables para crear o reemplazar un recordatorio.
 *
 * @param {Object} body - Datos enviados en formato JSON.
 * @param {boolean} requireAllFields - Indica si canal y leido deben venir explícitamente.
 * @returns {{tareaId: number, mensaje: string, fechaHora: string, canal: string, leido: boolean}} Datos normalizados.
 * @throws {HttpError} Lanza un error 422 si falta un campo requerido o algún valor es inválido.
 */
function validateFullRecordatorio(body, requireAllFields) {
  const payload = requireObjectBody(body);

  if (requireAllFields && payload.canal === undefined) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'canal' es obligatorio para reemplazar el recordatorio.");
  }

  if (requireAllFields && payload.leido === undefined) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'leido' es obligatorio para reemplazar el recordatorio.");
  }

  if (typeof payload.mensaje !== "string" || payload.mensaje.trim() === "") {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' es obligatorio.");
  }

  const mensaje = payload.mensaje.trim();

  if (mensaje.length > 255) {
    throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede superar 255 caracteres.");
  }

  return {
    tareaId: parsePositiveId(payload.tareaId, "tareaId"),
    mensaje,
    fechaHora: parseDateTime(payload.fechaHora, "fechaHora"),
    canal: payload.canal === undefined ? "in_app" : parseChannel(payload.canal),
    leido: payload.leido === undefined ? false : parseBoolean(payload.leido, "leido")
  };
}

/**
 * Valida los datos de un recordatorio nuevo; el canal y el estado de lectura tienen valores por defecto.
 *
 * @param {Object} body - Cuerpo JSON enviado en la solicitud.
 * @returns {Object} Campos validados para la inserción.
 * @throws {HttpError} Lanza un error 422 si un campo obligatorio es inválido.
 */
export function validateCreateRecordatorio(body) {
  return validateFullRecordatorio(body, false);
}

/**
 * Valida el conjunto completo de datos requerido al reemplazar un recordatorio.
 *
 * @param {Object} body - Cuerpo JSON enviado en la solicitud PUT.
 * @returns {Object} Campos validados para el reemplazo.
 * @throws {HttpError} Lanza un error 422 si falta un campo editable o algún valor es inválido.
 */
export function validateReplaceRecordatorio(body) {
  return validateFullRecordatorio(body, true);
}

/**
 * Valida únicamente los campos enviados para actualizar un recordatorio.
 *
 * @param {Object} body - Cuerpo JSON enviado en la solicitud PATCH.
 * @returns {Object} Campos presentes, validados y normalizados.
 * @throws {HttpError} Lanza un error 422 si no hay campos válidos para actualizar.
 */
export function validatePatchRecordatorio(body) {
  const payload = requireObjectBody(body);
  const partialRecordatorio = {};

  if (payload.tareaId !== undefined) {
    partialRecordatorio.tareaId = parsePositiveId(payload.tareaId, "tareaId");
  }

  if (payload.mensaje !== undefined) {
    if (typeof payload.mensaje !== "string" || payload.mensaje.trim() === "") {
      throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede estar vacío.");
    }

    partialRecordatorio.mensaje = payload.mensaje.trim();

    if (partialRecordatorio.mensaje.length > 255) {
      throw new HttpError(422, "VALIDATION_ERROR", "El campo 'mensaje' no puede superar 255 caracteres.");
    }
  }

  if (payload.fechaHora !== undefined) {
    partialRecordatorio.fechaHora = parseDateTime(payload.fechaHora, "fechaHora");
  }

  if (payload.canal !== undefined) {
    partialRecordatorio.canal = parseChannel(payload.canal);
  }

  if (payload.leido !== undefined) {
    partialRecordatorio.leido = parseBoolean(payload.leido, "leido");
  }

  if (Object.keys(partialRecordatorio).length === 0) {
    throw new HttpError(422, "VALIDATION_ERROR", "No se enviaron campos válidos para actualizar.");
  }

  return partialRecordatorio;
}
