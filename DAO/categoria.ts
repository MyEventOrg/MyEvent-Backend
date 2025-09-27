import BaseRepository from "../repository/base";
import { Categoria } from "../configs/models";

const categoriaRepository = new BaseRepository(Categoria);

class CategoriaDAO {
  static async findAll() {
    return categoriaRepository.findAll();
  }

  static async create(data: any) {
    return categoriaRepository.create(data);
  }

  static async findOne(id: number) {
    return categoriaRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return categoriaRepository.update(id, data);
  }

  static async remove(id: number) {
    return categoriaRepository.remove(id);
  }
}

export default CategoriaDAO;
