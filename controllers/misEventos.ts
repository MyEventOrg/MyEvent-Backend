// controllers/MisEventos.ts
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

class MisEventosController {
    static async getMisEventosCreadosActivosInactivos(
        req: Request,
        res: Response
    ): Promise<Response> {
        try {
            
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

         
            const pCreados = await ParticipacionDAO.findByUsuarioIdAndRoles(
                usuario_id,
                "organizador"
            );

          
            const creadosIds = uniq(pCreados.map((p: any) => Number(p.evento_id)));

       
            const eventosCreadosRaw = await EventoDAO.findByIds(creadosIds);

   
            const eventosCreados = await Promise.all(
                (eventosCreadosRaw || []).map(async (evento) => {
                    const asistentes = await ParticipacionDAO.countAsistentesByEventoId(
                        evento.evento_id
                    );
                    return {
                        ...adaptEvento(evento),
                        asistentes,
                    };
                })
            );

         
            return res.status(200).json({
                success: true,
                message: "Eventos creados obtenidos exitosamente",
                data: {
                    usuario_id,
                    total: eventosCreados.length,
                    eventosCreados,
                },
            });
        } catch (error: any) {
            console.error("Error en MisEventosController:", error);
            return res.status(500).json({
                success: false,
                message:
                    "Error interno del servidor al obtener los eventos creados",
            });
        }
    }
}


export default MisEventosController;
