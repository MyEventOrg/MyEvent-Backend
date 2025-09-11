import BaseRepository from "../repository/base";
import { Ubicacion } from "../configs/models";

const ubicacionRepository = new BaseRepository(Ubicacion);

class UbicacionDAO {
  static async findAll() {
    return ubicacionRepository.findAll();
  }

  static async create(data: any) {
    return ubicacionRepository.create(data);
  }

  static async findOne(id: number) {
    return ubicacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return ubicacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return ubicacionRepository.remove(id);
  }
}

export default UbicacionDAO;
