import { Request, Response } from "express";
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";
import UsuarioDAO from "../DAO/usuario";
import CategoriaDAO from "../DAO/categoria";
import EventoService from "../services/eventoService";
import { CreateEventoRequestDTO } from "../types/evento";
import { FileUploadService } from "../helpers/fileUpload";


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

    /**
     * Crear evento (con imagen y/o PDF)
     * Maneja tanto imágenes como archivos PDF usando validaciones específicas
     */
    static createEvento = [
        // Middleware para manejar archivos con validaciones específicas
        FileUploadService.getMulterConfig().fields([
            { name: 'pdf', maxCount: 1 },
            { name: 'recurso', maxCount: 1 },
            { name: 'file', maxCount: 1 }
        ]),
        
        async (req: Request, res: Response) => {
            try {
                // Extraer usuario_id
                const usuario_id = req.body.usuario_id || (req as any).user?.usuario_id;
                
                let pdfUrl = req.body.url_recurso; // URL existente si se proporciona
                
                // Obtener el archivo PDF de cualquier campo
                let pdfFile = req.file;
                if (!pdfFile && (req as any).files) {
                    const files = (req as any).files;
                    pdfFile = files.pdf?.[0] || files.recurso?.[0] || files.file?.[0];
                }
                
                // Si hay archivo PDF, validarlo específicamente como PDF y subirlo
                if (pdfFile) {
                    const validation = FileUploadService.validatePdfFile(pdfFile);
                    if (!validation.valid) {
                        return res.status(400).json({
                            success: false,
                            message: validation.error
                        });
                    }
                    
                    const uploadResult = await FileUploadService.uploadFile(pdfFile);
                    if (!uploadResult.success) {
                        return res.status(500).json({
                            success: false,
                            message: uploadResult.message
                        });
                    }
                    
                    pdfUrl = uploadResult.url;
                }

                const eventoData: CreateEventoRequestDTO = {
                    titulo: req.body.titulo,
                    descripcion_corta: req.body.descripcion_corta,
                    descripcion_larga: req.body.descripcion_larga,
                    fecha_evento: req.body.fecha_evento,
                    hora: req.body.hora,
                    tipo_evento: req.body.tipo_evento,
                    ubicacion: req.body.ubicacion,
                    latitud: req.body.latitud,
                    longitud: req.body.longitud,
                    ciudad: req.body.ciudad,
                    distrito: req.body.distrito,
                    url_direccion: req.body.url_direccion,
                    url_imagen: req.body.url_imagen, // ✅ Mantener imagen del sistema original
                    url_recurso: pdfUrl, // ✅ Incluir la URL del PDF
                    categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : undefined,
                    usuario_id: usuario_id
                };

                // Usar el servicio para crear el evento
                const eventoService = new EventoService();
                const result = await eventoService.createEvento(eventoData);

                if (result.success) {
                    return res.status(201).json(result);
                } else {
                    return res.status(400).json(result);
                }

            } catch (error: any) {
                console.error("Error en EventoController.createEvento:", error);
                return res.status(500).json({ 
                    success: false, 
                    message: "Error interno del servidor" 
                });
            }
        }
    ];
}

export default EventoController;
