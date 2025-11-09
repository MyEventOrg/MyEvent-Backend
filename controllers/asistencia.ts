import { Request, Response } from "express";
import ParticipacionDAO from "../DAO/participacion";
import EventoDAO from "../DAO/evento";

function adaptEvento(evento: any) {
    return {
        evento_id: evento.evento_id,
        titulo: evento.titulo,
        descripcion_corta: evento.descripcion_corta,
        fecha_evento: evento.fecha_evento,
        hora: evento.hora,
        tipo_evento: evento.tipo_evento,
        ubicacion: evento.ubicacion,
        ciudad: evento.ciudad,
        distrito: evento.distrito,
        url_imagen: evento.url_imagen,
        url_direccion: evento.url_direccion,
        estado_evento: evento.estado_evento,
    };
}

function uniq(arr: number[]) {
    return Array.from(new Set(arr));
}

class AsistenciaController {
    static async getEventosAsistidos(
        req: Request,
        res: Response
    ): Promise<Response> {
        try {
            // 1) Validar usuario_id desde varias posibles fuentes
            const usuarioRaw =
                req.params.usuarioId ??
                req.params.id ??
                req.query.usuarioId ??
                req.body.usuario_id;

            const usuario_id = Number(usuarioRaw);

            if (!usuario_id || Number.isNaN(usuario_id)) {
                return res.status(400).json({
                    success: false,
                    message: "usuario_id requerido y numérico",
                });
            }

            // 2) Buscar participaciones como asistente únicamente
            const participaciones = await ParticipacionDAO.findByUsuarioIdAndRoles(
                usuario_id,
                "asistente"
            );

            // 3) Extraer evento_ids únicos
            const eventoIds = uniq(participaciones.map((p: any) => Number(p.evento_id)));

            // 4) Obtener eventos activos
            const eventosRaw = await EventoDAO.findByIds(eventoIds);

            // 5) Adaptar a formato + contar asistentes
            const eventosAsistiendo = await Promise.all(
                eventosRaw.map(async (evento) => {
                    const asistentes = await ParticipacionDAO.countAsistentesByEventoId(
                        evento.evento_id
                    );
                    return {
                        ...adaptEvento(evento),
                        asistentes,
                    };
                })
            );
            // 6) Retornar respuesta
            return res.status(200).json({
                success: true,
                message: "Eventos como asistente obtenidos exitosamente",
                data: {
                    usuario_id,
                    total: eventosAsistiendo.length,
                    eventosAsistiendo,
                },
            });
        } catch (error: any) {
            console.error("Error en AsistenciaController.getEventosAsistidos:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener los eventos asistidos",
            });
        }
    }
}

export default AsistenciaController;
