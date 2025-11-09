import { Router } from "express";
import EventosGuardadoController from "../controllers/eventoGuardado";

const router = Router();

router.post("/guardarEvento", EventosGuardadoController.guardarEvento);

router.get("/guardados/:usuario_id", EventosGuardadoController.devolverEventosGuardados);

router.delete("/eliminarEventoGuardado", EventosGuardadoController.eliminarEventoGuardado);

export default router;
