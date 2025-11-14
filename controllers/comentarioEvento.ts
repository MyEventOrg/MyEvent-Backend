import { Request, Response } from "express";
import ComentarioEventoDAO from "../DAO/comentarioEvento";
import EventoDAO from "../DAO/evento";
import UsuarioDAO from "../DAO/usuario";

class ComentarioEventoController {

  // Obtener comentarios de un evento
  static async getComentariosByEvento(req: Request, res: Response) {
    try {
      const { evento_id } = req.params;
      const eventoId = Number(evento_id);

      if (!eventoId || isNaN(eventoId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de evento requerido" 
        });
      }

      // Verificar que el evento existe
      const evento = await EventoDAO.findOne(eventoId);
      if (!evento) {
        return res.status(404).json({ 
          success: false, 
          message: "Evento no encontrado" 
        });
      }

      const comentarios = await ComentarioEventoDAO.findByEventoId(eventoId);

      return res.status(200).json({
        success: true,
        data: comentarios,
        message: "Comentarios obtenidos correctamente"
      });

    } catch (error) {
      console.error("Error al obtener comentarios:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // Crear nuevo comentario
  static async createComentario(req: Request, res: Response) {
    try {
      const { evento_id, usuario_id, mensaje } = req.body;

      // Validaciones básicas
      if (!evento_id || !usuario_id || !mensaje) {
        return res.status(400).json({ 
          success: false, 
          message: "Todos los campos son requeridos" 
        });
      }

      if (mensaje.length > 200) {
        return res.status(400).json({ 
          success: false, 
          message: "El comentario no puede exceder 200 caracteres" 
        });
      }

      // Verificar que el evento existe
      const evento = await EventoDAO.findOne(evento_id);
      if (!evento) {
        return res.status(404).json({ 
          success: false, 
          message: "Evento no encontrado" 
        });
      }

      // Verificar que el evento está activo para permitir comentarios
      if (evento.estado_evento !== 'activo') {
        return res.status(403).json({ 
          success: false, 
          message: "No se pueden agregar comentarios a eventos inactivos" 
        });
      }

      // Verificar que el usuario existe
      const usuario = await UsuarioDAO.findOne(usuario_id);
      if (!usuario) {
        return res.status(404).json({ 
          success: false, 
          message: "Usuario no encontrado" 
        });
      }

      // Crear el comentario
      const nuevoComentario = await ComentarioEventoDAO.create({
        evento_id,
        usuario_id,
        mensaje: mensaje.trim()
      });

      if (!nuevoComentario) {
        return res.status(500).json({
          success: false,
          message: "Error al crear el comentario"
        });
      }

      // Obtener el comentario creado con datos del usuario
      const comentarioCompleto = await ComentarioEventoDAO.findByEventoId(evento_id);
      const comentarioCreado = comentarioCompleto.find(c => c.comentarioevento_id === nuevoComentario.comentarioevento_id);

      return res.status(201).json({
        success: true,
        data: comentarioCreado || nuevoComentario,
        message: "Comentario agregado correctamente"
      });

    } catch (error) {
      console.error("Error al crear comentario:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // Actualizar likes de un comentario
  static async updateLikes(req: Request, res: Response) {
    try {
      const { comentario_id } = req.params;
      const { action } = req.body; // 'like' o 'unlike'

      const comentarioId = Number(comentario_id);
      if (!comentarioId || isNaN(comentarioId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de comentario requerido" 
        });
      }

      // Obtener comentario actual
      const comentario = await ComentarioEventoDAO.findOne(comentarioId);
      if (!comentario) {
        return res.status(404).json({ 
          success: false, 
          message: "Comentario no encontrado" 
        });
      }

      // Calcular nuevo valor de likes
      const newLikes = action === 'like' ? comentario.likes + 1 : Math.max(0, comentario.likes - 1);
      
      await ComentarioEventoDAO.update(comentarioId, { likes: newLikes });

      return res.status(200).json({
        success: true,
        data: { likes: newLikes },
        message: "Likes actualizados correctamente"
      });

    } catch (error) {
      console.error("Error al actualizar likes:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // Actualizar dislikes de un comentario
  static async updateDislikes(req: Request, res: Response) {
    try {
      const { comentario_id } = req.params;
      const { action } = req.body; // 'dislike' o 'undislike'

      const comentarioId = Number(comentario_id);
      if (!comentarioId || isNaN(comentarioId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de comentario requerido" 
        });
      }

      // Obtener comentario actual
      const comentario = await ComentarioEventoDAO.findOne(comentarioId);
      if (!comentario) {
        return res.status(404).json({ 
          success: false, 
          message: "Comentario no encontrado" 
        });
      }

      // Calcular nuevo valor de dislikes
      const newDislikes = action === 'dislike' ? comentario.dislikes + 1 : Math.max(0, comentario.dislikes - 1);
      
      await ComentarioEventoDAO.update(comentarioId, { dislikes: newDislikes });

      return res.status(200).json({
        success: true,
        data: { dislikes: newDislikes },
        message: "Dislikes actualizados correctamente"
      });

    } catch (error) {
      console.error("Error al actualizar dislikes:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }

  // Eliminar comentario (solo el autor)
  static async deleteComentario(req: Request, res: Response) {
    try {
      const { comentario_id } = req.params;
      const { usuario_id } = req.body;

      const comentarioId = Number(comentario_id);
      if (!comentarioId || isNaN(comentarioId)) {
        return res.status(400).json({ 
          success: false, 
          message: "ID de comentario requerido" 
        });
      }

      // Verificar que el comentario existe
      const comentario = await ComentarioEventoDAO.findOne(comentarioId);
      if (!comentario) {
        return res.status(404).json({ 
          success: false, 
          message: "Comentario no encontrado" 
        });
      }

      // Verificar que el usuario es el autor del comentario
      if (comentario.usuario_id !== usuario_id) {
        return res.status(403).json({ 
          success: false, 
          message: "Solo puedes eliminar tus propios comentarios" 
        });
      }

      await ComentarioEventoDAO.remove(comentarioId);

      return res.status(200).json({
        success: true,
        message: "Comentario eliminado correctamente"
      });

    } catch (error) {
      console.error("Error al eliminar comentario:", error);
      return res.status(500).json({ 
        success: false, 
        message: "Error interno del servidor" 
      });
    }
  }
}

export default ComentarioEventoController;