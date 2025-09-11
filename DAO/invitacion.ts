import BaseRepository from "../repository/base";
import { Invitacion } from "../configs/models";

const invitacionRepository = new BaseRepository(Invitacion);

class InvitacionDAO {
  static async findAll() {
    return invitacionRepository.findAll();
  }

  static async create(data: any) {
    return invitacionRepository.create(data);
  }

  static async findOne(id: number) {
    return invitacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return invitacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return invitacionRepository.remove(id);
  }
}

export default InvitacionDAO;
