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

    // Obtener notificaciones priorizando invitaciones más recientes (solo 1 por evento)
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

        // Para evitar devolver varias notificaciones del mismo evento invitación
        const invitacionesProcesadas = new Set<string>();

        for (const n of notificaciones) {
            const tipo = n.get("tipo");
            const mensaje = n.get("mensaje");
            const evento_id = n.get("evento_id");

            // ============================
            // CASE 1: NO ES INVITACIÓN → agregar directo
            // ============================
            if (tipo !== "invitacion") {
                notificacionesFiltradas.push(n);
                continue;
            }

            // ============================
            // CASE 2: ES INVITACIÓN
            // ============================

            // A) Extraer correo si existe
            let invitadoIdFinal = usuario_id;
            const match = mensaje.match(/de correo:\s*"([^"]+)"/);
            const correoExtraido = match ? match[1] : null;

            if (correoExtraido) {
                const usuarioEncontrado = await UsuarioDAO.findByEmail(correoExtraido);
                if (usuarioEncontrado) {
                    invitadoIdFinal = usuarioEncontrado.usuario_id;
                }
            }

            // KEY para evitar duplicados por evento + invitado
            const key = `${evento_id}-${invitadoIdFinal}`;

            if (invitacionesProcesadas.has(key)) {
                continue; // ya se devolvió la más reciente
            }

            // B) Buscar invitación más reciente
            const invitacion = await Invitacion.findOne({
                where: {
                    evento_id,
                    invitado_id: invitadoIdFinal
                },
                order: [["fecha_invitacion", "DESC"]]
            });

            // C) Solo agregar si está pendiente
            if (invitacion && invitacion.get("estado") === "pendiente") {
                notificacionesFiltradas.push(n);

                // Marcamos como procesada para no repetir este evento + invitado
                invitacionesProcesadas.add(key);
            }
        }

        return notificacionesFiltradas;
    }


}

export default NotificacionDAO;
