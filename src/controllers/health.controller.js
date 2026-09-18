import { checkDatabaseConnection } from "../config/database.js";
import { sendSuccess } from "../utils/api-response.js";
//aqui hace una llamada asincronica (asincronica es una operacion que no bloquea la ejecucion del programa) a la funcion 
export async function getHealth(_request, response, next) {
  try {
    await checkDatabaseConnection();
// si conecta con la base de datos devuelve un estatus ok y un mensaje de que la base de datos esta conectada, si no conecta con la base de datos devuelve un error
    return sendSuccess(response, {
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    return next(error);
  }
}