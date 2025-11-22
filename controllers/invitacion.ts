import { Request, Response } from "express";
import ParticipacionDAO from "../DAO/participacion";
import InvitacionDAO from "../DAO/invitacion";
import NotificacionDAO from "../DAO/notificacion";
import UsuarioDAO from "../DAO/usuario";
import EventoDAO from "../DAO/evento";
import NotificacionController from "./notificacion";
import InvitacionService from "../services/invitacionService";

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
                await NotificacionController.notificarAsistenciaEvento(evento_id, usuario_id);

                return res.status(200).json({
                    success: true,
                    message: "El usuario se ha unido al evento exitosamente."
                });
            }

            // ============================================================
            //            EVENTO PRIVADO → Crear solicitud
            // ============================================================
            if (evento.tipo_evento === "privado") {

                // 1. Validar si ya existe una solicitud pendiente
                const solicitudExistente = await InvitacionDAO.findByEventoAndUsuario(evento_id, usuario_id);

                if (solicitudExistente && solicitudExistente.estado === "pendiente") {
                    return res.status(400).json({
                        success: false,
                        message: "Ya tienes una solicitud pendiente para este evento."
                    });
                }

                // 2. Obtener el organizador del evento
                const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento_id);

                if (!organizador) {
                    return res.status(500).json({
                        success: false,
                        message: "No se encontró un organizador para este evento."
                    });
                }

                // 3. Obtener datos del usuario solicitante
                const usuarioSolicitante = await UsuarioDAO.findOne(usuario_id);
                if (!usuarioSolicitante) {
                    return res.status(404).json({
                        success: false,
                        message: "Usuario no encontrado."
                    });
                }

                // 3. Crear la solicitud (tipo='solicitud')
                const solicitud = await InvitacionDAO.create({
                    estado: "pendiente",
                    mensaje: `${usuarioSolicitante.nombreCompleto} solicita unirse al evento.`,
                    tipo: "solicitud",  // ← Marca como solicitud
                    fecha_invitacion: new Date(),
                    organizador_id: organizador.usuario_id,
                    invitado_id: usuario_id,
                    evento_id
                });

                // 4. Crear notificación para el organizador
                await NotificacionDAO.create({
                    tipo: "invitacion",
                    mensaje: `${usuarioSolicitante.nombreCompleto} de correo: "${usuarioSolicitante.correo}" solicita asistir a tu evento "${evento.titulo}".`,
                    visto: false,
                    fecha_creacion: new Date(),
                    usuario_id: organizador.usuario_id,
                    evento_id
                });

                return res.status(200).json({
                    success: true,
                    message: "Solicitud enviada al organizador del evento. Recibirás una notificación cuando sea respondida."
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

    // ANULAR ASISTENCIA
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

            await NotificacionController.notificarAnuloAsistenciaEvento(evento_id, usuario_id);
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

    // JUAN-MODIFICACION: Obtener invitación pendiente para mostrar botones en notificación
    static async obtenerInvitacionPendiente(req: Request, res: Response) {
        try {
            const { evento_id, usuario_id } = req.params;

            const invitacion = await InvitacionDAO.findByEventoAndUsuario(
                Number(evento_id),
                Number(usuario_id)
            );

            if (!invitacion || invitacion.get("estado") !== "pendiente") {
                return res.status(404).json({
                    success: false,
                    message: "No hay invitación pendiente"
                });
            }

            return res.status(200).json({
                success: true,
                data: invitacion
            });
        } catch (error) {
            console.error("Error en obtenerInvitacionPendiente:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }

    static async obtenerAsistentesEvento(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const asistentes = await ParticipacionDAO.findAsistentesConUsuario(Number(id));
            return res.status(200).json({ success: true, data: asistentes || [] });
        } catch (error) {
            console.error("Error en obtenerAsistentesEvento:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }

    static async obtenerSugeridos(req: Request, res: Response) {
        try {
            const { organizador_id } = req.params;
            const service = new InvitacionService();
            const correos = await service.obtenerSugeridos(Number(organizador_id));
            return res.status(200).json({ success: true, data: correos });
        } catch (error) {
            console.error("Error en obtenerSugeridos:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }

    static async obtenerInvitacionesPendientes(req: Request, res: Response) {
        try {
            const { usuario_id } = req.params;
            const invitaciones = await InvitacionDAO.findPendientesByUsuario(Number(usuario_id));
            return res.status(200).json({ success: true, data: invitaciones || [] });
        } catch (error) {
            console.error("Error en obtenerInvitacionesPendientes:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }


    static async responderInvitacion(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { usuarioQueResponde_id, invitado_id, accion } = req.body;

            if (!invitado_id || !accion || !["aceptar", "rechazar"].includes(accion)) {
                return res.status(400).json({ success: false, message: "Datos inválidos" });
            }

            const service = new InvitacionService();
            // invitado_id representa quien responde (invitado en invitación, org/coorg en solicitud)
            const resultado = await service.responderInvitacion(
                Number(id),
                Number(usuarioQueResponde_id),   // quien responde (organizador o invitado)
                Number(invitado_id),             // quien será agregado si se acepta
                accion
            );

            return res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error("Error en responderInvitacion:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }
    // JUAN-MODIFICACION: Endpoints de invitaciones (HU40 y HU41)

    static async enviarInvitaciones(req: Request, res: Response) {
        try {
            const { evento_id, organizador_id, correos, mensaje } = req.body;

            if (!evento_id || !organizador_id || !correos) {
                return res.status(400).json({ success: false, message: "Faltan campos requeridos" });
            }

            const service = new InvitacionService();
            const resultado = await service.enviarInvitaciones({
                evento_id: Number(evento_id),
                organizador_id: Number(organizador_id),
                correos,
                mensaje
            });

            return res.status(resultado.success ? 200 : 400).json(resultado);

        } catch (error) {
            console.error("Error en enviarInvitaciones:", error);
            return res.status(500).json({ success: false, message: "Error interno" });
        }
    }

}

export default InvitacionController;
