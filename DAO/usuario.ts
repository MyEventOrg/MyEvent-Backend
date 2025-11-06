import BaseRepository from "../repository/base";
import { Usuario } from "../configs/models";
import { Op } from "sequelize";

const usuarioRepository = new BaseRepository<Usuario>(Usuario);


class UsuarioDAO {
  static async findAll() {
    return usuarioRepository.findAll();
  }

  static async create(data: any) {
    return usuarioRepository.create(data);
  }

  static async findOne(id: number): Promise<Usuario | null> {
    return Usuario.findByPk(id);
  }

  static async update(id: number, data: any) {
    return usuarioRepository.update(id, data);
  }

  static async remove(id: number) {
    return usuarioRepository.remove(id);
  }

  static async findByEmail(email: string) {
    return Usuario.findOne({ where: { correo: email } });
  }

  static async findPaginatedUsers(page: number, limit: number, search: string = "") {
    const offset = (page - 1) * limit;
    let where: any = { rol: "user" };

    if (search && search.trim() !== "") {
      where = {
        ...where,
        nombreCompleto: { [Op.like]: `%${search}%` }
      };
    }
    const { count, rows } = await Usuario.findAndCountAll({
      where,
      limit,
      offset,
      order: [["fecha_registro", "DESC"]],
    });
    return {
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }
}

export default UsuarioDAO;
