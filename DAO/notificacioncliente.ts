import BaseRepository from "../repository/base";
import { NotificacionCliente } from "../configs/models";

const notificacionClienteRepository = new BaseRepository(NotificacionCliente);

class NotificacionClienteDAO {
  static async findAll() {
    return notificacionClienteRepository.findAll();
  }

  static async create(data: any) {
    return notificacionClienteRepository.create(data);
  }

  static async findOne(id: number) {
    return notificacionClienteRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return notificacionClienteRepository.update(id, data);
  }

  static async remove(id: number) {
    return notificacionClienteRepository.remove(id);
  }
}

export default NotificacionClienteDAO;
