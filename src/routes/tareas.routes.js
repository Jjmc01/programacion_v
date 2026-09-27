import { Router } from "express";
import { listTareasByMateria } from "../controllers/tareas.controller.js";

const router = Router();

// GET /api/v1/materias/:materiaId/tareas
router.get("/materias/:materiaId/tareas", listTareasByMateria);

export default router;
