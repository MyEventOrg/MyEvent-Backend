import BaseRepository from "../repository/base";
import { EstadoInvitacion } from "../configs/models";

const estadoInvitacionRepository = new BaseRepository(EstadoInvitacion);

class EstadoInvitacionDAO {
  static async findAll() {
    return estadoInvitacionRepository.findAll();
  }

  static async create(data: any) {
    return estadoInvitacionRepository.create(data);
  }

  static async findOne(id: number) {
    return estadoInvitacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return estadoInvitacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return estadoInvitacionRepository.remove(id);
  }
}

export default EstadoInvitacionDAO;
