import BaseRepository from "../repository/base";
import { Invitacion } from "../configs/models";

const invitacionRepository = new BaseRepository<Invitacion>(Invitacion);

class InvitacionDAO {
  static async findAll() {
    return invitacionRepository.findAll();
  }

  static async create(data: any) {
    return invitacionRepository.create(data);
  }

  static async findOne(id: number) {
    return invitacionRepository.findOne(id);
  }

  static async update(id: number, data: any) {
    return invitacionRepository.update(id, data);
  }

  static async remove(id: number) {
    return invitacionRepository.remove(id);
  }

  static async findByEventoAndUsuario(evento_id: number, invitado_id: number) {
    return Invitacion.findOne({
      where: { evento_id, invitado_id },
      order: [["fecha_invitacion", "DESC"]]  // <--- clave
    });
  }
  // JUAN-MODIFICACION: Obtener invitaciones pendientes (HU41)
  static async findPendientesByUsuario(invitado_id: number) {
    return Invitacion.findAll({
      where: {
        invitado_id,
        estado: "pendiente"
      },
      order: [["fecha_invitacion", "DESC"]]
    });
  }

  // JUAN-MODIFICACION: Obtener correos sugeridos (HU40)
  static async findCorreosSugeridosByOrganizador(organizador_id: number): Promise<string[]> {
    const invitaciones = await Invitacion.findAll({
      where: { organizador_id },
      attributes: ["invitado_id"],
      group: ["invitado_id"]
    });

    const Usuario = require("../configs/models").Usuario;
    const usuarioIds = invitaciones.map((inv: any) => inv.invitado_id);

    if (usuarioIds.length === 0) return [];

    const usuarios = await Usuario.findAll({
      where: { usuario_id: usuarioIds },
      attributes: ["correo"]
    });

    return usuarios.map((u: any) => u.correo);
  }
}

export default InvitacionDAO;
