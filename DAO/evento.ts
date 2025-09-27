import BaseRepository from "../repository/base";
import { Evento } from "../configs/models";

const eventoRepository = new BaseRepository(Evento);

class EventoDAO {
  static async findAll() {
    return eventoRepository.findAll();
  }

  static async create(data: any) {
    return eventoRepository.create(data);
  }

  static async findOne(id: number) {
    return eventoRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return eventoRepository.update(id, data);
  }

  static async remove(id: number) {
    return eventoRepository.remove(id);
  }
}

export default EventoDAO;
