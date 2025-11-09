import { Router } from "express";
import AsistenciaController from "../controllers/asistencia";

const router = Router();

router.get("/mis-asistencias/:usuarioId", AsistenciaController.getEventosAsistidos);

export default router;
