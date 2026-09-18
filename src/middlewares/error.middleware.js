// esto signfica que estamos creando un middleware de express para manejar los errores
// las variables signfican:
// error: el objeto de error que se lanza en la aplicacion
// request: el objeto de solicitud de express
// response: el objeto de respuesta de express
// next: la funcion next de express que se llama para pasar al siguiente middleware
export function notFoundHandler(_request, _response, next) {
  const error = new Error("Ruta no encontrada");
  error.statusCode = 404;
  error.code = "NOT_FOUND";
  next(error);
}
//esta funcion es para manejar los errores que se lanzan en la aplicacion, y devuelve un objeto con el codigo de estado y el mensaje de error
export function errorHandler(error, _request, response, _next) {
  const isJsonSyntaxError = error instanceof SyntaxError && error.status === 400 && "body" in error;
  const statusCode = isJsonSyntaxError ? 400 : error.statusCode || 500; // esta quiere decir que si el error es un error de sintaxis de JSON, entonces el codigo de estado es 400, si no, entonces el codigo de estado es el que tenga el error, si no tiene, entonces es 500
  const code = isJsonSyntaxError
    ? "INVALID_JSON"
    : error.code || (statusCode === 404 ? "NOT_FOUND" : "INTERNAL_ERROR");// 
  const message = isJsonSyntaxError
    ? "El cuerpo JSON enviado no es válido."
    : error.message || "Error interno del servidor";

  response.status(statusCode).json({
    success: false,
    error: {
      code,
      message
    }
  });
}
