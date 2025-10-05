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

// Utility class para manejo de fechas
class DateUtils {
    /**
     * Parsea una fecha de evento usando UTC para evitar problemas de zona horaria
     * @param dateString - String de fecha en formato YYYY-MM-DD
     * @returns Date object en UTC
     */
    static parseEventDate(dateString: string): Date {
        // Usar Date.parse con formato ISO para garantizar UTC
        // Agregar 'T00:00:00.000Z' para forzar UTC
        const isoString = `${dateString}T00:00:00.000Z`;
        return new Date(isoString);
    }

    /**
     * Obtiene la fecha actual normalizada en UTC (sin horas)
     * @returns Date object con fecha actual en UTC sin horas
     */
    static getTodayNormalized(): Date {
        const today = new Date();
        // Crear fecha en UTC usando UTC methods
        return new Date(Date.UTC(
            today.getUTCFullYear(),
            today.getUTCMonth(),
            today.getUTCDate(),
            0, 0, 0, 0
        ));
    }

    /**
     * Obtiene la fecha y hora actual en zona horaria de Perú (UTC-5)
     * Forzando que se guarde como la fecha correcta sin conversión UTC
     * @returns Date object que al guardarse mantenga la fecha local de Perú
     */
    static getCurrentDateTime(): Date {
        // Obtener la fecha actual en Perú
        const nowInPeru = new Date().toLocaleString("en-US", {
            timeZone: "America/Lima",
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        
        // Parsear los componentes: "10/04/2025, 23:20:36"
        const [datePart, timePart] = nowInPeru.split(', ');
        const [month, day, year] = datePart.split('/').map(Number);
        const [hour, minute, second] = timePart.split(':').map(Number);
        
        // Crear fecha UTC que cuando se muestre localmente sea la fecha de Perú
        // Necesitamos crear una fecha que al convertirse a UTC mantenga el día correcto
        return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
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

        // Validación para descripción larga
        if (!data.descripcion_larga || data.descripcion_larga.trim().length < 25) {
            errors.push("La descripción larga debe tener al menos 25 caracteres");
        }
        if (data.descripcion_larga && data.descripcion_larga.length > 1000) {
            errors.push("La descripción larga no puede exceder 1000 caracteres");
        }

        if (!data.fecha_evento) {
            errors.push("La fecha del evento es requerida");
        } else {
            // Usar la utilidad de parsing para fechas
            const eventDate = DateUtils.parseEventDate(data.fecha_evento);
            const today = DateUtils.getTodayNormalized();
            
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
                fecha_evento: DateUtils.parseEventDate(data.fecha_evento),
                fecha_creacion_evento: DateUtils.getCurrentDateTime(), // Usar fecha controlada
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
                url_recurso: data.url_recurso || null, 
                estado_evento: "pendiente", 
                categoria_id: data.categoria_id || null,
                url_imagen: data.url_imagen?.trim() || null,
            };

            // Crear el evento en la base de datos
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