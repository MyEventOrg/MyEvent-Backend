import BaseRepository from "../repository/base";
import { Participacion } from "../configs/models";
import { Op } from "sequelize";
const participacionRepository = new BaseRepository<Participacion>(Participacion);

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

  static async findByUsuarioId(usuario_id: number) {
    return Participacion.findAll({ where: { usuario_id } });
  }

  static async findByUsuarioIdAndRoles(usuario_id: number, roles: string[] | string) {
    const arr = Array.isArray(roles) ? roles : [roles];
    return Participacion.findAll({
      where: { usuario_id, rol_evento: { [Op.in]: arr } },
      attributes: ["participacion_id", "evento_id", "rol_evento"],
    });
  }

  static async countAsistentesByEventoId(evento_id: number) {
    try {
      return await Participacion.count({
        where: {
          evento_id,
          rol_evento: "asistente",
        },
      });
    } catch (error) {
      console.error("Error en countAsistentesByEventoId:", error);
      return 0;
    }
  }

  static async findByEventoAndUsuario(evento_id: number, usuario_id: number) {
    return Participacion.findAll({
      where: {
        evento_id,
        usuario_id,
      },
    });
  }

  static async findByEventoId(eventoId: number) {
    return Participacion.findAll({ where: { evento_id: eventoId } });
  }
}

export default ParticipacionDAO;
