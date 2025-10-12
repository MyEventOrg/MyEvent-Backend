// controllers/resumen.ts (versión SIN PATRONES)
import { Request, Response } from "express";
import ParticipacionDAO from "../DAO/participacion";
import EventosGuardadoDAO from "../DAO/eventosGuardado";
import EventoDAO from "../DAO/evento";

interface ResumenData {
    usuario_id: number;
    totals: {
        creados: number;
        asistiendo: number;
        guardados: number;
    };
    data: {
        eventosCreados: any[];
        eventosAsistiendo: any[];
        eventosGuardados: any[];
    };
}

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
    };
}

function uniq(arr: number[]) {
    return Array.from(new Set(arr));
}

class ResumenController {
    static async getMisEventosMisEventosAsistidosMisEventosGUardados(
        req: Request,
        res: Response
    ): Promise<Response> {
        try {
            // 1) Validar usuario_id desde varias posibles fuentes
            const usuarioRaw =
                (req.params.usuarioId ??
                    req.params.id ??
                    req.query.usuarioId ??
                    req.body.usuario_id) as any;

            const usuario_id = Number(usuarioRaw);

            if (!usuario_id || Number.isNaN(usuario_id)) {
                return res.status(400).json({
                    success: false,
                    message: "usuario_id requerido y numérico",
                });
            }

            // 2) Traer participaciones y guardados en paralelo
            const [pCreados, pAsistiendo, guardados] = await Promise.all([
                ParticipacionDAO.findByUsuarioIdAndRoles(usuario_id, "organizador"),
                ParticipacionDAO.findByUsuarioIdAndRoles(usuario_id, [
                    "asistente",
                    "coorganizador",
                ]),
                EventosGuardadoDAO.findByUsuarioId(usuario_id),
            ]);

            // 3) Obtener IDs únicos
            const creadosIds = uniq(pCreados.map((p: any) => Number(p.evento_id)));
            const asistiendoIds = uniq(
                pAsistiendo.map((p: any) => Number(p.evento_id))
            );
            const guardadosIds = uniq(guardados.map((g: any) => Number(g.evento_id)));

            // 4) Buscar eventos activos por cada grupo
            const [eventosCreadosRaw, eventosAsistiendoRaw, eventosGuardadosRaw] =
                await Promise.all([
                    EventoDAO.findByIdsActivos(creadosIds),
                    EventoDAO.findByIdsActivos(asistiendoIds),
                    EventoDAO.findByIdsActivos(guardadosIds),
                ]);

            // 5) Adaptar a formato uniforme
            const eventosCreados = (eventosCreadosRaw || []).map(adaptEvento);
            const eventosAsistiendo = (eventosAsistiendoRaw || []).map(adaptEvento);
            const eventosGuardados = (eventosGuardadosRaw || []).map(adaptEvento);

            // 6) Construir respuesta
            const resumen: ResumenData = {
                usuario_id,
                totals: {
                    creados: eventosCreados.length,
                    asistiendo: eventosAsistiendo.length,
                    guardados: eventosGuardados.length,
                },
                data: { eventosCreados, eventosAsistiendo, eventosGuardados },
            };

            return res.status(200).json({
                success: true,
                message: "Resumen de eventos obtenido exitosamente",
                data: resumen,
            });
        } catch (error: any) {
            console.error("Error en ResumenController:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor al obtener el resumen",
            });
        }
    }
}

export default ResumenController;
