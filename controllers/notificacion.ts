import { Request, Response } from "express";
import NotificacionDAO from "../DAO/notificacion";

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
}
export default NotificacionController;
