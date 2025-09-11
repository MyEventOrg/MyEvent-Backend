import BaseRepository from "../repository/base";
import { Notificacion } from "../configs/models";

const notificacionRepository = new BaseRepository(Notificacion);

class NotificacionDAO {
  static async findAll() {
    return notificacionRepository.findAll();
  }

  static async create(data: any) {
    return notificacionRepository.create(data);
  }

  static async findOne(id: number) {
    return notificacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return notificacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return notificacionRepository.remove(id);
  }
}

export default NotificacionDAO;
