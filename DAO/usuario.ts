import BaseRepository from "../repository/base";
import { Usuario } from "../configs/models";

const usuarioRepository = new BaseRepository(Usuario);

class UsuarioDAO {
  static async findAll() {
    return usuarioRepository.findAll();
  }

  static async create(data: any) {
    return usuarioRepository.create(data);
  }

  static async findOne(id: number) {
    return usuarioRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return usuarioRepository.update(id, data);
  }

  static async remove(id: number) {
    return usuarioRepository.remove(id);
  }
}

export default UsuarioDAO;
