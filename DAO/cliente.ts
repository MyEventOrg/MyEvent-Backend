import BaseRepository from "../repository/base";
import { Cliente } from "../configs/models";

const clienteRepository = new BaseRepository(Cliente);

class ClienteDAO {
  static async findAll() {
    return clienteRepository.findAll();
  }

  static async create(data: any) {
    return clienteRepository.create(data);
  }

  static async findOne(id: number) {
    return clienteRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return clienteRepository.update(id, data);
  }

  static async remove(id: number) {
    return clienteRepository.remove(id);
  }
}

export default ClienteDAO;
