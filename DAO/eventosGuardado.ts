import BaseRepository from "../repository/base";
import { EventosGuardado } from "../configs/models";

const eventosGuardadoRepository = new BaseRepository<EventosGuardado>(EventosGuardado);

class EventosGuardadoDAO {
  static async findAll() {
    return eventosGuardadoRepository.findAll();
  }

  static async create(data: any) {
    return eventosGuardadoRepository.create(data);
  }

  static async findOne(id: number) {
    return eventosGuardadoRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return eventosGuardadoRepository.update(id, data);
  }

  static async remove(id: number) {
    return eventosGuardadoRepository.remove(id);
  }

  static async findByUsuarioId(usuario_id: number) {
    return EventosGuardado.findAll({
      where: { usuario_id },
      attributes: ["evento_id"],
    });
  }
}

export default EventosGuardadoDAO;
