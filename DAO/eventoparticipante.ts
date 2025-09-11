import BaseRepository from "../repository/base";
import { EventoParticipante } from "../configs/models";

const eventoParticipanteRepository = new BaseRepository(EventoParticipante);

class EventoParticipanteDAO {
  static async findAll() {
    return eventoParticipanteRepository.findAll();
  }

  static async create(data: any) {
    return eventoParticipanteRepository.create(data);
  }

  static async findOne(id: number) {
    return eventoParticipanteRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return eventoParticipanteRepository.update(id, data);
  }

  static async remove(id: number) {
    return eventoParticipanteRepository.remove(id);
  }
}

export default EventoParticipanteDAO;
