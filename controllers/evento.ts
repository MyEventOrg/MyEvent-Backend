import { Request, Response } from "express";
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";
import UsuarioDAO from "../DAO/usuario";
import CategoriaDAO from "../DAO/categoria";


class EventoController {
    static async getEventosPublicos(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = 10;

            const result = await EventoDAO.findPublicEvents(page, limit);

            const dataWithRelations = await Promise.all(
                result.data.map(async (evento: any) => {
                    // Buscar organizador
                    const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento.evento_id);
                    let organizadorInfo = null;

                    if (organizador) {
                        const usuario = await UsuarioDAO.findOne(organizador.usuario_id);
                        if (usuario) {
                            organizadorInfo = {
                                usuario_id: usuario.get("usuario_id"),
                                nombreCompleto: usuario.get("nombreCompleto"),
                                correo: usuario.get("correo"),
                                apodo: usuario.get("apodo"),
                            };
                        }
                    }

                    // Buscar categoría
                    let categoriaInfo = null;
                    if (evento.categoria_id) {
                        const categoria = await CategoriaDAO.findOne(evento.categoria_id);
                        if (categoria) {
                            categoriaInfo = {
                                categoria_id: categoria.get("categoria_id"),
                                nombre: categoria.get("nombre"),
                            };
                        }
                    }

                    return {
                        ...evento.toJSON(),
                        organizador: organizadorInfo,
                        categoria: categoriaInfo,
                    };
                })
            );

            return res.json({
                data: dataWithRelations,
                page: result.page,
                total: result.total,
                totalPages: result.totalPages,
                hasNextPage: page < result.totalPages,
                hasPrevPage: page > 1,
            });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: "Error al obtener eventos públicos" });
        }
    }

    static async getEventosPrivados(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = 10;

            const result = await EventoDAO.findPrivateEvents(page, limit);

            const dataWithRelations = await Promise.all(
                result.data.map(async (evento: any) => {
                    // Buscar organizador
                    const organizador = await ParticipacionDAO.findOrganizadorByEventoId(evento.evento_id);
                    let organizadorInfo = null;

                    if (organizador) {
                        const usuario = await UsuarioDAO.findOne(organizador.usuario_id);
                        if (usuario) {
                            organizadorInfo = {
                                usuario_id: usuario.get("usuario_id"),
                                nombreCompleto: usuario.get("nombreCompleto"),
                                correo: usuario.get("correo"),
                                apodo: usuario.get("apodo"),
                            };
                        }
                    }

                    // Buscar categoría
                    let categoriaInfo = null;
                    if (evento.categoria_id) {
                        const categoria = await CategoriaDAO.findOne(evento.categoria_id);
                        if (categoria) {
                            categoriaInfo = {
                                categoria_id: categoria.get("categoria_id"),
                                nombre: categoria.get("nombre"),
                            };
                        }
                    }

                    return {
                        ...evento.toJSON(),
                        organizador: organizadorInfo,
                        categoria: categoriaInfo,
                    };
                })
            );

            return res.json({
                data: dataWithRelations,
                page: result.page,
                total: result.total,
                totalPages: result.totalPages,
                hasNextPage: page < result.totalPages,
                hasPrevPage: page > 1,
            });
        } catch (error: any) {
            console.error(error);
            return res.status(500).json({ error: "Error al obtener eventos privados" });
        }
    }
    static async updateEstado(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { estado } = req.body;

            if (!estado) {
                return res.status(400).json({ success: false, message: "El nuevo estado es requerido" });
            }

            const estadosValidos = ["pendiente", "activo", "rechazado"];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({ success: false, message: "Estado no permitido" });
            }

            const result = await EventoDAO.update(Number(id), { estado_evento: estado });

            if (!result) {
                return res.status(404).json({ success: false, message: "Evento no encontrado" });
            }

            return res.json({ success: true, message: "Estado actualizado correctamente" });
        } catch (error: any) {
            console.error("Error al actualizar estado del evento:", error);
            return res.status(500).json({ success: false, message: "Error interno del servidor" });
        }
    }
}

export default EventoController;
