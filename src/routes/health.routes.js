import { Router } from "express";
import { getHealth } from "../controllers/health.controller.js";

// aqui la estamos inicializando 
const router = Router();
//esta seria la primera ruta 
router.get("/", getHealth);
//y creo que aqui lo estamos exportando 
export default router;
