import BaseRepository from "../repository/base";
import { Participante } from "../configs/models";

const participanteRepository = new BaseRepository(Participante);

class ParticipanteDAO {
  static async findAll() {
    return participanteRepository.findAll();
  }

  static async create(data: any) {
    return participanteRepository.create(data);
  }

  static async findOne(id: number) {
    return participanteRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return participanteRepository.update(id, data);
  }

  static async remove(id: number) {
    return participanteRepository.remove(id);
  }
}

export default ParticipanteDAO;
