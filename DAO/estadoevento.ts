import BaseRepository from "../repository/base";
import { EstadoEvento } from "../configs/models";

const estadoEventoRepository = new BaseRepository(EstadoEvento);

class EstadoEventoDAO {
  static async findAll() {
    return estadoEventoRepository.findAll();
  }

  static async create(data: any) {
    return estadoEventoRepository.create(data);
  }

  static async findOne(id: number) {
    return estadoEventoRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return estadoEventoRepository.update(id, data);
  }

  static async remove(id: number) {
    return estadoEventoRepository.remove(id);
  }
}

export default EstadoEventoDAO;
