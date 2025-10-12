import { Router } from "express";
import NotificationController from "../controllers/notificacion";

const router = Router();

router.post("/enviar-codigo", NotificationController.enviarCodigoVerificacion);
router.post("/verificar-codigo", NotificationController.verificarEmail);

export default router;
