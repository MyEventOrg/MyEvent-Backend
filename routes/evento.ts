import { Router } from "express";
import EventoController from "../controllers/evento";

const router = Router();

router.get("/eventos/publicos", EventoController.getEventosPublicos);

router.get("/eventos/privados", EventoController.getEventosPrivados);

router.put("/eventos/:id/estado", EventoController.updateEstado);

router.post("/eventos", EventoController.createEvento);

router.get("/buscarEventos/:usuarioId", EventoController.getEventosFiltrados);

router.get("/evento/:id", EventoController.getEvento);

router.get("/eventoEditar/:id", EventoController.cargarEventoEditar)

router.put("/updateEvento/:id", EventoController.updateEvento)


router.delete("/deleteEvento/:id", EventoController.deleteEvento)

export default router;
