// aqui la estamos inicializando y sus variables significan:
// response: el objeto de respuesta de Express
// data: los datos a enviar en la respuesta
// statusCode: el código de estado HTTP (por defecto 200)
// meta: información adicional sobre la respuesta
export function sendSuccess(response, data, statusCode = 200, meta) {
  // aqui estamos creando un objeto payload (payload es el objeto que se envía como respuesta) que contiene la informacion que vamos a enviar al cliente
  const payload = {
    success: true,
    data
  };
//esto quiere decir que si meta es diferente de null o undefined, entonces se agrega al objeto payload
  if (meta) {
    payload.meta = meta;
  }
// aqui va a devolver la respuesta con el codigo de estado (el codigo de estado es 200) y el objeto payload en formato JSON
  return response.status(statusCode).json(payload);
}
//aqui estamos creando una funcion que devuelve un objeto con un codigo de estado 204 (no content) y no devuelve ningun contenido
// se hace  para indicar que la solicitud se ha procesado correctamente, pero no hay contenido que devolver
export function sendNoContent(response) {
  return response.status(204).send();
}
