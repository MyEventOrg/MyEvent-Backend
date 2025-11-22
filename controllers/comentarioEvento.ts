import { Request, Response } from "express";
import ComentarioEventoFacade from "../facade/ComentarioEventoFacade";

class ComentarioEventoController {

  static async getComentariosByEvento(req: Request, res: Response) {
    try {
      const eventoId = Number(req.params.evento_id);
      const data = await ComentarioEventoFacade.obtenerComentarios(eventoId);

      return res.json({ success: true, data });
    } catch (e: any) {
      return manejarErrores(e, res);
    }
  }

  static async createComentario(req: Request, res: Response) {
    try {
      const { evento_id, usuario_id, mensaje } = req.body;
      const data = await ComentarioEventoFacade.crearComentario(evento_id, usuario_id, mensaje);

      return res.status(201).json({ success: true, data });
    } catch (e: any) {
      return manejarErrores(e, res);
    }
  }

  static async updateLikes(req: Request, res: Response) {
    try {
      const id = Number(req.params.comentario_id);
      const likes = await ComentarioEventoFacade.actualizarLikes(id, req.body.action);

      return res.json({ success: true, data: { likes } });
    } catch (e: any) {
      return manejarErrores(e, res);
    }
  }

  static async updateDislikes(req: Request, res: Response) {
    try {
      const id = Number(req.params.comentario_id);
      const dislikes = await ComentarioEventoFacade.actualizarDislikes(id, req.body.action);

      return res.json({ success: true, data: { dislikes } });
    } catch (e: any) {
      return manejarErrores(e, res);
    }
  }

  static async deleteComentario(req: Request, res: Response) {
    try {
      const id = Number(req.params.comentario_id);
      const { usuario_id } = req.body;

      await ComentarioEventoFacade.eliminarComentario(id, usuario_id);

      return res.json({ success: true, message: "Eliminado correctamente" });
    } catch (e: any) {
      return manejarErrores(e, res);
    }
  }

}
function manejarErrores(e: any, res: any) {
  const map: any = {
    EVENTO_NO_EXISTE: [404, "Evento no encontrado"],
    USUARIO_NO_EXISTE: [404, "Usuario no encontrado"],
    MENSAJE_LARGO: [400, "El comentario excede 200 caracteres"],
    MENSAJE_VACIO: [400, "El comentario no puede ir vacío"],
    EVENTO_NO_ACTIVO: [403, "Evento no permite comentarios"],
    COMENTARIO_NO_EXISTE: [404, "Comentario no encontrado"],
    NO_AUTORIZADO: [403, "No autorizado"],
  };

  if (map[e.message]) {
    const [code, msg] = map[e.message];
    return res.status(code).json({ success: false, message: msg });
  }

  console.error("Error inesperado:", e);
  return res.status(500).json({
    success: false,
    message: "Error interno del servidor",
  });
}

export default ComentarioEventoController;
