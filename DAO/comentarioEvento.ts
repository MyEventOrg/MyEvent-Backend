import BaseRepository from "../repository/base";
import { ComentarioEvento, Usuario } from "../configs/models";

const comentarioEventoRepository = new BaseRepository<ComentarioEvento>(ComentarioEvento);

class ComentarioEventoDAO {
  static async findAll() {
    return comentarioEventoRepository.findAll();
  }

  static async create(data: any) {
    return comentarioEventoRepository.create(data);
  }

  static async findOne(id: number) {
    return comentarioEventoRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return comentarioEventoRepository.update(id, data);
  }

  static async remove(id: number) {
    return comentarioEventoRepository.remove(id);
  }

  // Obtener comentarios de un evento con datos del usuario
  static async findByEventoId(evento_id: number) {
    try {
      return await ComentarioEvento.findAll({
        where: { evento_id },
        attributes: ['comentarioevento_id', 'mensaje', 'likes', 'dislikes', 'usuario_id', 'evento_id'],
        include: [{
          model: Usuario,
          attributes: ['nombreCompleto', 'apodo', 'url_imagen']
        }],
        order: [['comentarioevento_id', 'DESC']]
      });
    } catch (error) {
      throw error;
    }
  }

  // Actualizar likes de un comentario
  static async updateLikes(comentario_id: number, likes: number) {
    try {
      return await ComentarioEvento.update(
        { likes },
        { where: { comentarioevento_id: comentario_id } }
      );
    } catch (error) {
      throw error;
    }
  }

  // Actualizar dislikes de un comentario
  static async updateDislikes(comentario_id: number, dislikes: number) {
    try {
      return await ComentarioEvento.update(
        { dislikes },
        { where: { comentarioevento_id: comentario_id } }
      );
    } catch (error) {
      throw error;
    }
  }
}

export default ComentarioEventoDAO;
