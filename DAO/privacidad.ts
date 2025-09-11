import BaseRepository from "../repository/base";
import { Privacidad } from "../configs/models";

const privacidadRepository = new BaseRepository(Privacidad);

class PrivacidadDAO {
  static async findAll() {
    return privacidadRepository.findAll();
  }

  static async create(data: any) {
    return privacidadRepository.create(data);
  }

  static async findOne(id: number) {
    return privacidadRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return privacidadRepository.update(id, data);
  }

  static async remove(id: number) {
    return privacidadRepository.remove(id);
  }
}

export default PrivacidadDAO;
