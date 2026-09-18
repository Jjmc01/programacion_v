import { Router } from "express";   
import {listMaterias, getMaterias} from "../controllers/materias.controller.js";

const router = Router();
router.get("/",listMaterias);
router.get("/:id", getMaterias);
export default router;