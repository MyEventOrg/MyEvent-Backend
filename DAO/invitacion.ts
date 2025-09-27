import BaseRepository from "../repository/base";
import { Participacion } from "../configs/models";

const participacionRepository = new BaseRepository(Participacion);

class ParticipacionDAO {
  static async findAll() {
    return participacionRepository.findAll();
  }

  static async create(data: any) {
    return participacionRepository.create(data);
  }

  static async findOne(id: number) {
    return participacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return participacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return participacionRepository.remove(id);
  }
}

export default ParticipacionDAO;
