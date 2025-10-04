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

  //nuevo método para paginar eventos públicos
  static async findPublicEvents(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Evento.findAndCountAll({
      where: { tipo_evento: "publico" },
      limit,
      offset,
      order: [["evento_id", "DESC"]],
    });

    return {
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

  // nuevo método para paginar eventos privados
  static async findPrivateEvents(page: number, limit: number) {
    const offset = (page - 1) * limit;

    const { count, rows } = await Evento.findAndCountAll({
      where: { tipo_evento: "privado" },
      limit,
      offset,
      order: [["evento_id", "DESC"]],
    });

    return {
      data: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
  }

}

export default EventoDAO;
