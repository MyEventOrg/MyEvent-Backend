import { Router } from "express";
import NotificacionController from "../controllers/notificacion";

const router = Router();

router.get("/notificaciones/:usuario_id", NotificacionController.getNotificaciones);

router.put("/notificacionvista", NotificacionController.notificacionVista);

export default router;
