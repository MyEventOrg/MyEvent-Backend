import { Request, Response } from "express";
import NotificacionDAO from "../DAO/notificacion";
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";

class NotificacionController {

    static async getNotificaciones(req: Request, res: Response): Promise<Response> {
        try {
            const { usuario_id } = req.params;

            if (!usuario_id) {
                return res.status(400).json({
                    ok: false,
                    message: "Debe enviar usuario_id"
                });
            }

            const notificaciones = await NotificacionDAO.findByUserOrdered(Number(usuario_id));

            return res.json({
                ok: true,
                notificaciones
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                ok: false,
                message: "Error al obtener notificaciones"
            });
        }
    }
    static async notificacionVista(req: Request, res: Response): Promise<Response> {
        try {
            const { notificacion_id } = req.body;

            if (!notificacion_id) {
                return res.status(400).json({
                    ok: false,
                    message: "Debe enviar notificacion_id"
                });
            }

            // 🟢 Actualiza usando tu BaseRepository sin problema
            const updated = await NotificacionDAO.update(
                Number(notificacion_id),
                { visto: true }
            );

            if (!updated) {
                return res.status(404).json({
                    ok: false,
                    message: "No se encontró la notificación"
                });
            }

            return res.json({
                ok: true,
                message: "Notificación marcada como vista",
                notificacion: updated
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({
                ok: false,
                message: "Error al marcar notificación como vista"
            });
        }
    }


    static async crearNotificacionEventoActivo(evento_id: number) {
        try {
            const evento = await EventoDAO.findOne(evento_id);
            if (!evento) {
                console.error("No se encontró el evento para notificación");
                return;
            }

            const titulo = evento.get("titulo");

            const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento_id);
            if (!organizador) {
                console.error("No se encontró el organizador del evento");
                return;
            }

            const usuario_id = organizador.usuario_id;

            const mensaje = `El evento ${titulo} ha sido aprobado por un administrador! Dirigete a "Mis Eventos" para poder visualizarlo mejor.`;

            const ahora = new Date();
            const fecha_creacion =
                `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ` +
                `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;

            await NotificacionDAO.create({
                usuario_id,
                evento_id,
                mensaje,
                visto: false,
                fecha_creacion
            });

        } catch (error) {
            console.error("❌ Error en crearNotificacionEventoActivo:", error);
        }
    }


}
export default NotificacionController;
