import BaseRepository from "../repository/base";
import { Notificacion } from "../configs/models";

const notificacionRepository = new BaseRepository<Notificacion>(Notificacion);

class NotificacionDAO {

    // Eliminar notificaciones antiguas de invitación para un usuario y evento
    static async findInvitacionesByUsuarioYEvento(usuario_id: number, evento_id: number) {
        return Notificacion.findAll({
            where: {
                usuario_id,
                evento_id,
                tipo: 'invitacion'
            }
        });
    }
    static async findAll() {
        return notificacionRepository.findAll();
    }

    static async create(data: any) {
        return notificacionRepository.create(data);
    }

    static async findOne(id: number) {
        return notificacionRepository.findOne(id);
    }

    static async update(id: number, data: any) {
        return notificacionRepository.update(id, data);
    }

    static async remove(id: number) {
        return notificacionRepository.remove(id);
    }


    static async findByUserOrdered(usuario_id: number) {
        return Notificacion.findAll({
            where: { usuario_id },
            order: [
                ["visto", "ASC"],
                ["fecha_creacion", "DESC"]
            ]
        });
    }

    // JUAN-MODIFICACION: Obtener notificaciones filtrando invitaciones ya respondidas
    static async findByUserOrderedConInvitacionesPendientes(usuario_id: number) {
        const { Invitacion } = require("../configs/models");
        const UsuarioDAO = require("../DAO/usuario").default;

        const notificaciones = await Notificacion.findAll({
            where: { usuario_id },
            order: [
                ["visto", "ASC"],
                ["fecha_creacion", "DESC"]
            ]
        });

        const notificacionesFiltradas = [];

        for (const n of notificaciones) {
            const tipo = n.get("tipo");
            const mensaje = n.get("mensaje");

            // Si no es invitación → incluir normal
            if (tipo !== "invitacion") {
                notificacionesFiltradas.push(n);
                continue;
            }

            // ============================
            // 1. ¿El mensaje contiene un correo?
            // ============================
            let invitadoIdFinal = usuario_id; // por defecto se usa el id original

            const match = mensaje.match(/de correo:\s*"([^"]+)"/);
            const correoExtraido = match ? match[1] : null;

            if (correoExtraido) {
                // ============================
                // 2. Buscar usuario por correo
                // ============================
                const usuarioEncontrado = await UsuarioDAO.findByEmail(correoExtraido);

                if (usuarioEncontrado) {
                    invitadoIdFinal = usuarioEncontrado.usuario_id;
                }
            }

            // ============================
            // 3. Buscar invitación del usuario correcto
            // ============================
            const evento_id = n.get("evento_id");

            const invitacion = await Invitacion.findOne({
                where: {
                    evento_id,
                    invitado_id: invitadoIdFinal
                },
                order: [["fecha_invitacion", "DESC"]]
            });

            // ============================
            // 4. Solo mostrar si está pendiente
            // ============================
            if (invitacion && invitacion.get("estado") === "pendiente") {
                notificacionesFiltradas.push(n);
            }
        }

        return notificacionesFiltradas;
    }

}

export default NotificacionDAO;
