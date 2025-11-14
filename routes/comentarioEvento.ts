import { Router } from "express";
import ComentarioEventoController from "../controllers/comentarioEvento";

const router = Router();

// Obtener comentarios de un evento
router.get("/comentarios/evento/:evento_id", ComentarioEventoController.getComentariosByEvento);

// Crear nuevo comentario
router.post("/comentarios", ComentarioEventoController.createComentario);

// Actualizar likes de un comentario
router.put("/comentarios/:comentario_id/likes", ComentarioEventoController.updateLikes);

// Actualizar dislikes de un comentario
router.put("/comentarios/:comentario_id/dislikes", ComentarioEventoController.updateDislikes);

// Eliminar comentario
router.delete("/comentarios/:comentario_id", ComentarioEventoController.deleteComentario);

export default router;