import { Router } from "express";
import MisEventosController from "../controllers/misEventos";

const router = Router();

router.get("/mis-eventos-creados/:usuarioId", MisEventosController.getMisEventosCreadosActivosInactivos);

export default router;
