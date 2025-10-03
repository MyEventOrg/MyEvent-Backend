import BaseRepository from "../repository/base";
import { Participacion } from "../configs/models";

const participacionRepository = new BaseRepository(Participacion);

class ParticipacionDAO {
  static async findAll() {
    return participacionRepository.findAll();
  }

  static async create(data: any) {
    return participacionRepository.create(data);
  }

  static async findOne(id: number) {
    return participacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return participacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return participacionRepository.remove(id);
  }

  static async findOrganizadorByEventoId(eventoId: number) {
    try {
      const result = await Participacion.findOne({
        where: { evento_id: eventoId, rol_evento: "organizador" }
      });

      return result;
    } catch (error) {
      console.error("Error en findOrganizadorByEventoId:", error);
      return null;
    }
  }
}

export default ParticipacionDAO;
