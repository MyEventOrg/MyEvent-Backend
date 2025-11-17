import { Router } from "express";
import VerificacionController from "../controllers/verificacion";

const router = Router();

router.post("/enviar-codigo", VerificacionController.enviarCodigoVerificacion);
router.post("/verificar-codigo", VerificacionController.verificarEmail);

export default router;
