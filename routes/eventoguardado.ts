import { Router } from "express";
import EventosGuardadoController from "../controllers/eventoGuardado";

const router = Router();

router.post("/guardarEvento", EventosGuardadoController.guardarEvento);

export default router;
