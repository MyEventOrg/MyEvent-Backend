// Service Layer - Aplica principio de Responsabilidad Única (SRP)
import EventoDAO from "../DAO/evento";
import ParticipacionDAO from "../DAO/participacion";
import { EventoCreationAttributes } from "../configs/models";
import { CreateEventoRequestDTO } from "../types/evento";
import { GoogleMapsHelper } from "../helpers/googleMaps";
import { GeocodingService } from "../helpers/geocoding";

export interface CreateEventoResponse {
    success: boolean;
    evento?: any;
    message?: string;
}

// Patrón Strategy 
interface ValidationStrategy {
    validate(data: CreateEventoRequestDTO): { valid: boolean; errors: string[] };
}

class BasicEventoValidation implements ValidationStrategy {
    validate(data: CreateEventoRequestDTO): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!data.titulo || data.titulo.trim().length < 3) {
            errors.push("El título debe tener al menos 3 caracteres");
        }
        if (data.titulo && data.titulo.length > 60) {
            errors.push("El título no puede exceder 60 caracteres");
        }

        if (!data.descripcion_corta || data.descripcion_corta.trim().length < 10) {
            errors.push("La descripción corta debe tener al menos 10 caracteres");
        }
        if (data.descripcion_corta && data.descripcion_corta.length > 200) {
            errors.push("La descripción corta no puede exceder 200 caracteres");
        }

        if (!data.fecha_evento) {
            errors.push("La fecha del evento es requerida");
        } else {
            const eventDate = new Date(data.fecha_evento);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (eventDate < today) {
                errors.push("La fecha del evento no puede ser anterior a hoy");
            }
        }

        if (!data.hora) {
            errors.push("La hora del evento es requerida");
        }

        if (!data.tipo_evento || !["publico", "privado"].includes(data.tipo_evento)) {
            errors.push("El tipo de evento debe ser 'publico' o 'privado'");
        }

        // El usuario_id siempre debe estar presente
        if (!data.usuario_id) {
            errors.push("Error del sistema: identificador de usuario requerido");
        }

        return { valid: errors.length === 0, errors };
    }
}

// Patrón Factory para crear validadores
class ValidationFactory {
    static createValidator(type: string = "basic"): ValidationStrategy {
        switch (type) {
            case "basic":
            default:
                return new BasicEventoValidation();
        }
    }
}

// Service principal 
class EventoService {
    private validator: ValidationStrategy;

    constructor(validationType: string = "basic") {
        this.validator = ValidationFactory.createValidator(validationType);
    }

    async createEvento(data: CreateEventoRequestDTO): Promise<CreateEventoResponse> {
        try {
            // Validación
            const validation = this.validator.validate(data);
            if (!validation.valid) {
                return {
                    success: false,
                    message: `Errores de validación: ${validation.errors.join(", ")}`
                };
            }

            // Extraer distrito automáticamente si no se proporcionó
            let distrito = data.distrito?.trim() || null;
            if (!distrito && (data.ubicacion || data.ciudad)) {
                distrito = GeocodingService.extractDistrito({
                    ubicacion: data.ubicacion,
                    ciudad: data.ciudad,
                    distrito: data.distrito
                });
            }

            // Auto-completar ciudad basada en distrito y ubicación
            let ciudad = data.ciudad?.trim() || null;
            if (!ciudad) {
                ciudad = GeocodingService.extractCiudad(
                    data.ubicacion || '', 
                    distrito || undefined
                );
            }

            // Preparar datos para el modelo
            const eventoData: EventoCreationAttributes = {
                titulo: data.titulo.trim(),
                descripcion_corta: data.descripcion_corta.trim(),
                descripcion_larga: data.descripcion_larga?.trim() || null,
                fecha_evento: new Date(data.fecha_evento),
                fecha_creacion_evento: new Date(),
                hora: data.hora,
                tipo_evento: data.tipo_evento,
                ubicacion: data.ubicacion?.trim() || null,
                latitud: data.latitud || null,
                longitud: data.longitud || null,
                ciudad: ciudad,
                distrito: distrito,
                // Generar URL de Google Maps automáticamente si no se proporciona
                url_direccion: data.url_direccion || GoogleMapsHelper.generateMapUrl({
                    ubicacion: data.ubicacion,
                    latitud: data.latitud,
                    longitud: data.longitud,
                    ciudad: ciudad,
                    distrito: distrito || undefined
                }),
                url_recurso: data.url_recurso || null, // ✅ AGREGADO EXPLÍCITAMENTE
                estado_evento: "pendiente", // Estado inicial
                categoria_id: data.categoria_id || null,
                url_imagen: data.url_imagen?.trim() || null,
            };

            // 5. Crear el evento en la base de datos
            const evento = await EventoDAO.create(eventoData);

            if (!evento) {
                return {
                    success: false,
                    message: "Error al crear el evento en la base de datos"
                };
            }

            // Crear participación como organizador
            await ParticipacionDAO.create({
                usuario_id: data.usuario_id,
                evento_id: evento.get("evento_id"),
                rol_evento: "organizador",
                fecha_registro: new Date()
            });

            return {
                success: true,
                evento: evento.toJSON(),
                message: "Evento creado exitosamente"
            };

        } catch (error: any) {
            console.error("Error en EventoService.createEvento:", error);
            return {
                success: false,
                message: "Error interno del servidor al crear el evento"
            };
        }
    }
}

export default EventoService;