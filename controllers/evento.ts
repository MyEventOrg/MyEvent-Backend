import { Request, Response } from "express";
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";
import UsuarioDAO from "../DAO/usuario";
import CategoriaDAO from "../DAO/categoria";
import EventosGuardadosDAO from "../DAO/eventosGuardado";
import EventoService from "../services/eventoService";
import InvitacionDAO from "../DAO/invitacion";

import { FileUploadService } from "../helpers/fileUpload";

export interface CreateEventoRequestDTO {
    titulo: string;
    descripcion_corta: string;
    descripcion_larga?: string;
    fecha_evento: string;
    hora: string;
    tipo_evento: "publico" | "privado";
    ubicacion?: string;
    latitud?: string;
    longitud?: string;
    ciudad?: string;
    distrito?: string;
    url_direccion?: string;
    url_recurso?: string;
    categoria_id?: number;
    usuario_id: number;
    url_imagen?: string;
}

class EventoController {

    static async getEvento(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const eventoId = Number(id);
            const usuario_id = Number(req.query.usuario_id); // 👈 usuario_id por query
            const validarUsuario = await UsuarioDAO.findOne(usuario_id);
            if (!validarUsuario) {
                return res.status(404).json({ success: false, message: "Usuario no encontrado" });
            }

            if (!eventoId || isNaN(eventoId)) {
                return res.status(400).json({ success: false, message: "ID de evento requerido" });
            }

            // 1️⃣ Obtener evento
            const evento = await EventoDAO.findOne(eventoId);
            if (!evento) {
                return res.status(404).json({ success: false, message: "Evento no encontrado" });
            }

            // 2️⃣ Validar estado
            const estadoEvento = evento.get("estado_evento");
            if (!["activo", "vencido"].includes(estadoEvento)) {
                return res.status(403).json({ success: false, message: "Este evento no está disponible actualmente" });
            }

            // 3️⃣ Contar asistentes
            let asistentesList = [];
            if (usuario_id && !isNaN(usuario_id)) {
                const participantes = await ParticipacionDAO.findByEventoId(eventoId); // Asegúrate de tener este método
                const asistentesFiltrados = participantes.filter(p => p.rol_evento === "asistente");

                for (const participante of asistentesFiltrados) {
                    const usuario = await UsuarioDAO.findOne(participante.usuario_id);

                    if (usuario) {
                        asistentesList.push({
                            nombre: usuario.get("nombreCompleto"),
                            correo: usuario.get("correo"),
                            url_imagen: usuario.get("url_imagen") || null,
                        });
                    }
                }
            }


            // 4️⃣ Determinar rol del usuario (si se pasó)
            let rol: "organizador" | "asistente" | "asistenciapendiente" | "nada" = "nada";

            if (usuario_id && !isNaN(usuario_id)) {
                const participaciones = await ParticipacionDAO.findByEventoAndUsuario(eventoId, usuario_id);

                // 🔹 Si el usuario participa formalmente
                if (participaciones.length > 0) {
                    const rolEvento = participaciones[0].rol_evento;

                    if (rolEvento === "organizador") rol = "organizador";
                    else if (rolEvento === "asistente") rol = "asistente";

                } else {
                    // 🔹 Si NO participa → Revisar invitación
                    const invitacion = await InvitacionDAO.findByEventoAndUsuario(eventoId, usuario_id);

                    if (invitacion) {
                        const estado = invitacion.get("estado");

                        if (estado === "pendiente") {
                            rol = "asistenciapendiente";
                        } else if (estado === "aceptada") {
                            rol = "asistente"; // Invitación aprobada, pero aún no participa como asistente real
                        } else if (estado === "rechazada") {
                            rol = "nada";
                        }
                    }
                }
            }

            // 5️⃣ Organizador
            let organizadorInfo = null;
            const organizador = await ParticipacionDAO.findOrganizadorByEventoId(eventoId);
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

            // 6️⃣ Categoría
            const categoriaId = evento.get("categoria_id");
            let categoriaInfo = null;

            if (typeof categoriaId === "number") {
                const categoria = await CategoriaDAO.findOne(categoriaId);
                if (categoria) {
                    categoriaInfo = {
                        categoria_id: categoria.get("categoria_id"),
                        nombre: categoria.get("nombre"),
                    };
                }
            }

            // 7️⃣ Preparar respuesta
            const eventoData = {
                ...(evento.toJSON?.() ?? evento),
                rol,
                organizador: organizadorInfo,
                categoria: categoriaInfo,
                asistentes_list: asistentesList,
            };

            return res.status(200).json({
                success: true,
                data: eventoData,
            });

        } catch (error: any) {
            console.error("Error en getEvento:", error);
            return res.status(500).json({
                success: false,
                message: "Error al obtener el evento",
            });
        }
    }


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
        FileUploadService.getMulterConfig().fields([
            { name: 'pdf', maxCount: 1 },
            { name: 'recurso', maxCount: 1 },
            { name: 'file', maxCount: 1 }
        ]),

        async (req: Request, res: Response) => {
            try {
                const usuario_id = req.body.usuario_id || (req as any).user?.usuario_id;

                let pdfUrl = req.body.url_recurso;

                let pdfFile = req.file;
                if (!pdfFile && (req as any).files) {
                    const files = (req as any).files;
                    pdfFile = files.pdf?.[0] || files.recurso?.[0] || files.file?.[0];
                }

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
                    url_imagen: req.body.url_imagen,
                    url_recurso: pdfUrl,
                    categoria_id: req.body.categoria_id ? parseInt(req.body.categoria_id) : undefined,
                    usuario_id: usuario_id
                };

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

    static async getEventosFiltrados(req: Request, res: Response) {
        try {
            // 1️⃣ Validar usuario_id desde la URL
            const usuario_id = Number(req.params.usuarioId);
            if (!usuario_id || isNaN(usuario_id)) {
                return res.status(400).json({ error: "usuario_id inválido en la URL" });
            }

            // 2️⃣ Obtener filtros desde query
            const search = (req.query.search as string) || "";
            const tipo = (req.query.tipo as string) || "";
            const categoriaNombre = (req.query.categoria as string) || "Todos";

            let categoria_id: number | undefined;
            if (categoriaNombre !== "Todos") {
                const id = await CategoriaDAO.findIdByNombre(categoriaNombre);
                if (id) categoria_id = id;
            }

            // 3️⃣ Obtener los eventos filtrados
            const eventosRaw = await EventoDAO.findFiltered(search, tipo, categoria_id);

            // 4️⃣ Obtener eventos guardados del usuario
            const eventosGuardados = await EventosGuardadosDAO.findByUsuarioId(usuario_id);
            const idsGuardados = new Set(
                (eventosGuardados || []).map((eg: any) => Number(eg.evento_id))
            );

            // 5️⃣ Adaptar los eventos
            const eventosAdaptados = await Promise.all(
                (eventosRaw || []).map(async (evento: any) => {
                    const asistentes = await ParticipacionDAO.countAsistentesByEventoId(evento.evento_id);

                    // ⭐⭐ NUEVA LÓGICA COMPLETA DE ROL (igual a getEvento ⭐⭐)
                    let rol: "organizador" | "asistente" | "asistenciapendiente" | "nada" = "nada";

                    // primero buscar participación
                    const participaciones = await ParticipacionDAO.findByEventoAndUsuario(
                        evento.evento_id,
                        usuario_id
                    );

                    if (participaciones && participaciones.length > 0) {
                        const rolEvento = participaciones[0].rol_evento;

                        if (rolEvento === "organizador") rol = "organizador";
                        else if (rolEvento === "asistente") rol = "asistente";
                    }
                    else {
                        // si NO participa, buscar invitaciones
                        const invitacion = await InvitacionDAO.findByEventoAndUsuario(
                            evento.evento_id,
                            usuario_id
                        );

                        if (invitacion) {
                            const estado = invitacion.get("estado");

                            if (estado === "pendiente") {
                                rol = "asistenciapendiente";
                            } else if (estado === "aceptada") {
                                rol = "asistente";
                            } else if (estado === "rechazada") {
                                rol = "nada";
                            }
                        }
                    }

                    // Determinar si está guardado
                    const guardado = idsGuardados.has(evento.evento_id) ? "si" : "no";

                    return {
                        ...(evento.toJSON?.() ?? evento),
                        asistentes,
                        rol,
                        guardado,
                    };
                })
            );

            // 6️⃣ Respuesta final
            return res.status(200).json({
                data: eventosAdaptados,
                total: eventosAdaptados.length,
            });
        } catch (error) {
            console.error("Error en getEventosFiltrados:", error);
            return res.status(500).json({ error: "Error al filtrar eventos" });
        }
    }



}

export default EventoController;
