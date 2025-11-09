import BaseRepository from "../repository/base";
import { Categoria } from "../configs/models";
import { Op } from "sequelize";

const categoriaRepository = new BaseRepository<Categoria>(Categoria);

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

  static async findIdByNombre(nombre: string): Promise<number | null> {
    const categoria = await categoriaRepository.findOneByWhere({
      nombre: { [Op.like]: `%${nombre}%` }, // ✅ usar like en lugar de iLike
    });

    return categoria?.categoria_id ?? null;
  }




}

export default CategoriaDAO;
