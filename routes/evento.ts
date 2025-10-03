import { Router } from "express";
import EventoController from "../controllers/evento";

const router = Router();

router.get("/eventos/publicos", EventoController.getEventosPublicos);

router.get("/eventos/privados", EventoController.getEventosPrivados);

router.put("/eventos/:id/estado", EventoController.updateEstado);

export default router;
