import BaseRepository from "../repository/base";
import { Notificacion } from "../configs/models";

const notificacionRepository = new BaseRepository<Notificacion>(Notificacion);

class NotificacionDAO {
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

        // Obtener todas las notificaciones del usuario
        const notificaciones = await Notificacion.findAll({
            where: { usuario_id },
            order: [
                ["visto", "ASC"],
                ["fecha_creacion", "DESC"]
            ]
        });

        // Filtrar manualmente las invitaciones ya respondidas
        const notificacionesFiltradas = [];

        for (const n of notificaciones) {
            const tipo = n.get("tipo");

            // Si es notificación normal, incluirla siempre
            if (tipo === 'normal') {
                notificacionesFiltradas.push(n);
                continue;
            }

            // Si es invitación, verificar que esté pendiente
            if (tipo === 'invitacion') {
                const evento_id = n.get("evento_id");
                const invitacion = await Invitacion.findOne({
                    where: {
                        evento_id,
                        invitado_id: usuario_id
                    },
                    order: [["fecha_invitacion", "DESC"]]
                });

                // Solo incluir si la invitación está pendiente
                if (invitacion && invitacion.get("estado") === 'pendiente') {
                    notificacionesFiltradas.push(n);
                }
            }
        }

        return notificacionesFiltradas;
    }
}

export default NotificacionDAO;
