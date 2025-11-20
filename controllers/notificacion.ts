import { Request, Response } from "express";
import NotificacionDAO from "../DAO/notificacion";
import EventoDAO from "../DAO/evento";
import UsuarioDAO from "../DAO/usuario";
import ParticipacionDAO from "../DAO/participacion";
import fs from "fs";
import path from "path";
import { transporter, MAIL } from "../configs/mailer";
type EstadoEvento = "pendiente" | "activo" | "rechazado";

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


    static async crearNotificacionCambioEstadoEvento(evento_id: number, estado: EstadoEvento) {
        try {
            const evento = await EventoDAO.findOne(evento_id);
            if (!evento) return;

            const titulo = evento.get("titulo");

            const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento_id);
            if (!organizador) return;

            const usuario_id = organizador.usuario_id;
            const usuario = await UsuarioDAO.findOne(usuario_id);
            if (!usuario) return;

            const correo = usuario.get("correo");

            let mensaje = `Un administrador ha actualizado el estado de tu evento "${titulo}" a "${estado}".`;

            if (estado === "activo") {
                mensaje += " Tu evento ha sido publicado correctamente y ahora es visible para otros usuarios.";
            }

            if (estado === "rechazado") {
                mensaje += " Lamentablemente, tu evento ha sido rechazado. Revisa los detalles con un administrador.";
            }

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

            const templatePath = path.join(process.cwd(), "templates", "estadoEventoActualizado.html");
            const template = fs.readFileSync(templatePath, "utf8");

            const textos = {
                activo: {
                    header: "Evento aprobado",
                    estadoTexto: "Aprobado",
                    descripcion: "Tu evento ha sido aprobado y publicado. Ya es visible para todos los usuarios."
                },
                rechazado: {
                    header: "Evento rechazado",
                    estadoTexto: "Rechazado",
                    descripcion: "Tu evento fue revisado pero lamentablemente no cumple los requisitos necesarios."
                },
                pendiente: {
                    header: "Estado actualizado",
                    estadoTexto: "Pendiente",
                    descripcion: "Tu evento se encuentra nuevamente en revisión."
                }
            } as const;

            const html = template
                .replace(/{{TITULO}}/g, titulo)
                .replace(/{{HEADER}}/g, textos[estado].header)
                .replace(/{{ESTADO_TEXTO}}/g, textos[estado].estadoTexto)
                .replace(/{{DESCRIPCION}}/g, textos[estado].descripcion)
                .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

            const subjectPorEstado: Record<EstadoEvento, string> = {
                activo: `Tu evento "${titulo}" ha sido aprobado.`,
                rechazado: `Tu evento "${titulo}" ha sido rechazado.`,
                pendiente: `El estado de tu evento "${titulo}" ha sido actualizado`,
            };

            await transporter.sendMail({
                from: MAIL.FROM,
                to: correo,
                subject: subjectPorEstado[estado],
                html
            });

        } catch (error) {
            console.error("Error en crearNotificacionCambioEstadoEvento:", error);
        }
    }

    static async notificarEliminacionEvento(evento_id: number) {
        try {
            const evento = await EventoDAO.findOne(evento_id);
            if (!evento) return;

            const titulo = evento.get("titulo");

            const participaciones = await ParticipacionDAO.findByEventoId(evento_id);

            const asistentes = participaciones.filter(p => p.rol_evento === "asistente");
            const organizador = participaciones.find(p => p.rol_evento === "organizador");

            const ahora = new Date();
            const fecha_creacion =
                `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')} ` +
                `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}`;


            const templateAsistente = fs.readFileSync(
                path.join(process.cwd(), "templates", "eventoEliminado.html"), "utf8"
            );

            for (const asistente of asistentes) {
                const user = await UsuarioDAO.findOne(asistente.usuario_id);
                if (!user) continue;

                const html = templateAsistente
                    .replace(/{{TITULO}}/g, titulo)
                    .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

                await transporter.sendMail({
                    from: MAIL.FROM,
                    to: user.get("correo"),
                    subject: `Aviso: El evento "${titulo}" ha sido eliminado`,
                    html
                });
            }

            if (organizador) {
                const organizadorUser = await UsuarioDAO.findOne(organizador.usuario_id);

                if (organizadorUser) {
                    const templateOrganizador = fs.readFileSync(
                        path.join(process.cwd(), "templates", "eventoEliminadoOrganizador.html"), "utf8"
                    );

                    const htmlOrg = templateOrganizador
                        .replace(/{{TITULO}}/g, titulo)
                        .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

                    await transporter.sendMail({
                        from: MAIL.FROM,
                        to: organizadorUser.get("correo"),
                        subject: `Has eliminado tu evento "${titulo}" correctamente`,
                        html: htmlOrg
                    });
                }
            }

            console.log("Notificaciones enviadas a asistentes y organizador.");

        } catch (error) {
            console.error("Error en notificarEliminacionEvento:", error);
        }
    }
}
export default NotificacionController;
