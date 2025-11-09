import { Request, Response } from "express";
import EventosGuardadoDAO from "../DAO/eventosGuardado";
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";

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
        latitud: evento.latitud,
        longitud: evento.longitud,
    };
}
class EventosGuardadoController {
    // Guardar evento para un usuario
    static async guardarEvento(req: Request, res: Response): Promise<Response> {
        try {
            const { usuario_id, evento_id } = req.body;

            // Validación básica
            if (!usuario_id || !evento_id) {
                return res.status(400).json({
                    success: false,
                    message: "usuario_id y evento_id son requeridos",
                });
            }

            // Crear el registro en la tabla de guardados
            const guardado = await EventosGuardadoDAO.create({ usuario_id, evento_id });

            return res.status(201).json({
                success: true,
                message: "Evento guardado exitosamente",
                data: guardado,
            });
        } catch (error) {
            console.error("Error en guardarEvento:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno al guardar evento",
            });
        }
    }

    static async eliminarEventoGuardado(req: Request, res: Response): Promise<Response> {
        try {
            const { usuario_id, evento_id } = req.body;

            if (!usuario_id || !evento_id) {
                return res.status(400).json({
                    success: false,
                    message: "usuario_id y evento_id son requeridos",
                });
            }

            // Eliminarlo
            await EventosGuardadoDAO.removeByUsuarioYEvento(usuario_id, evento_id);

            return res.status(200).json({
                success: true,
                message: "Evento eliminado de guardados correctamente",
            });

        } catch (error) {
            console.error("Error en eliminarEventoGuardado:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno al eliminar evento guardado",
            });
        }
    }

    // Nuevo método: devolver eventos guardados de un usuario
    static async devolverEventosGuardados(req: Request, res: Response): Promise<Response> {
        try {
            const usuarioRaw =
                req.params.usuario_id ??
                req.params.id ??
                req.query.usuario_id ??
                req.body.usuario_id;

            const usuario_id = Number(usuarioRaw);

            if (!usuario_id || Number.isNaN(usuario_id)) {
                return res.status(400).json({
                    success: false,
                    message: "El usuario_id es requerido y debe ser numérico",
                });
            }

            // Obtener los evento_id guardados por el usuario
            const eventosGuardados = await EventosGuardadoDAO.findByUsuarioId(usuario_id);
            const eventoIds = eventosGuardados.map((e) => e.evento_id);

            if (eventoIds.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No hay eventos guardados para este usuario",
                    data: [],
                });
            }

            // Obtener eventos (activos o vencidos)
            const eventosRaw = await EventoDAO.findByIdsActivosAndVencidos(eventoIds);

            // Agregar asistentes a cada evento
            const eventosConAsistentes = await Promise.all(
                eventosRaw.map(async (evento) => {
                    const asistentes = await ParticipacionDAO.countAsistentesByEventoId(evento.evento_id);
                    return {
                        ...adaptEvento(evento),
                        asistentes,
                    };
                })
            );

            return res.status(200).json({
                success: true,
                message: "Eventos guardados encontrados",
                data: {
                    usuario_id,
                    total: eventosConAsistentes.length,
                    eventos: eventosConAsistentes,
                },
            });
        } catch (error) {
            console.error("Error en devolverEventosGuardados:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno al obtener eventos guardados",
            });
        }
    }


}

export default EventosGuardadoController;
