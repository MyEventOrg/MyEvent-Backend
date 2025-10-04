import { Router } from "express";
import EventoController from "../controllers/resumen";

const router = Router();

router.get("/resumen/:usuarioId", EventoController.getMisEventosMisEventosAsistidosMisEventosGUardados);


export default router;
