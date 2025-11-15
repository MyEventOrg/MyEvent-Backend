import { Request, Response } from "express";
import ParticipacionDAO from "../DAO/participacion";
import InvitacionDAO from "../DAO/invitacion";
import EventoDAO from "../DAO/evento";

class InvitacionController {

    static async asistenciaEvento(req: Request, res: Response) {
        try {
            const { evento_id, usuario_id } = req.body;

            if (!evento_id || !usuario_id) {
                return res.status(400).json({
                    success: false,
                    message: "evento_id y usuario_id son obligatorios."
                });
            }

            // 1. Obtener evento usando tu método findOne
            const evento = await EventoDAO.findOne(evento_id);

            if (!evento) {
                return res.status(404).json({
                    success: false,
                    message: "El evento no existe."
                });
            }

            // 2. Validar si el usuario YA está participando
            const existente = await ParticipacionDAO.findByEventoAndUsuario(evento_id, usuario_id);

            if (existente.length > 0) {
                return res.status(405).json({
                    success: false,
                    message: "El usuario ya participa en el evento."
                });
            }

            // ============================================================
            //            EVENTO PÚBLICO → Registrar asistencia
            // ============================================================
            if (evento.tipo_evento === "publico") {
                await ParticipacionDAO.create({
                    evento_id,
                    usuario_id,
                    rol_evento: "asistente",
                    fecha_registro: new Date()
                });

                return res.status(200).json({
                    success: true,
                    message: "El usuario se ha unido al evento exitosamente."
                });
            }

            // ============================================================
            //            EVENTO PRIVADO → Crear invitación
            // ============================================================
            if (evento.tipo_evento === "privado") {

                // Obtener organizador
                const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento_id);

                if (!organizador) {
                    return res.status(500).json({
                        success: false,
                        message: "No se encontró un organizador para este evento."
                    });
                }

                await InvitacionDAO.create({
                    estado: "pendiente",
                    mensaje: "Solicitud de invitación al evento.",
                    fecha_invitacion: new Date(),
                    organizador_id: organizador.usuario_id,
                    invitado_id: usuario_id,
                    evento_id
                });

                return res.status(200).json({
                    success: true,
                    message: "Invitación enviada al organizador del evento, favor de estar atento a sus notificaciones."
                });
            }

            // Tipo no válido
            return res.status(400).json({
                success: false,
                message: "El tipo de evento no es válido."
            });

        } catch (error) {
            console.error("Error en asistenciaEvento:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor."
            });
        }
    }

    // 🔥 ANULAR ASISTENCIA
    static async anularAsistenciaEvento(req: Request, res: Response) {
        try {
            const { evento_id, usuario_id } = req.body;

            if (!evento_id || !usuario_id) {
                return res.status(400).json({
                    success: false,
                    message: "evento_id y usuario_id son obligatorios."
                });
            }

            // 1. Buscar si existe una participación (asistente u organizador)
            const participaciones = await ParticipacionDAO.findByEventoAndUsuario(evento_id, usuario_id);

            if (!participaciones || participaciones.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "El usuario no está inscrito en este evento."
                });
            }

            const participacion = participaciones[0];

            // 2. Prevenir eliminación del organizador
            if (participacion.rol_evento === "organizador") {
                return res.status(403).json({
                    success: false,
                    message: "El organizador no puede anular su asistencia."
                });
            }

            // 3. Eliminar participación
            await ParticipacionDAO.remove(participacion.participacion_id);

            return res.status(200).json({
                success: true,
                message: "La asistencia ha sido anulada exitosamente."
            });

        } catch (error) {
            console.error("Error en anularAsistenciaEvento:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor."
            });
        }
    }
}

export default InvitacionController;
