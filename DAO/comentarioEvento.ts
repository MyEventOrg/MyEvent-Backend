import BaseRepository from "../repository/base";
import { ComentarioEvento } from "../configs/models";

const comentarioEventoRepository = new BaseRepository<ComentarioEvento>(ComentarioEvento);

class ComentarioEventoDAO {
  static async findAll() {
    return comentarioEventoRepository.findAll();
  }

  static async create(data: any) {
    return comentarioEventoRepository.create(data);
  }

  static async findOne(id: number) {
    return comentarioEventoRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return comentarioEventoRepository.update(id, data);
  }

  static async remove(id: number) {
    return comentarioEventoRepository.remove(id);
  }
}

export default ComentarioEventoDAO;
