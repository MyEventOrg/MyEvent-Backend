import BaseRepository from "../repository/base";
import { Rol } from "../configs/models";

const rolRepository = new BaseRepository(Rol);

class RolDAO {
  static async findAll() {
    return rolRepository.findAll();
  }

  static async create(data: any) {
    return rolRepository.create(data);
  }

  static async findOne(id: number) {
    return rolRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return rolRepository.update(id, data);
  }

  static async remove(id: number) {
    return rolRepository.remove(id);
  }
}

export default RolDAO;
