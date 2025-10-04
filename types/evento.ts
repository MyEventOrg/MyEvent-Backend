// Tipos compartidos para requests y responses de eventos
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
}

export interface CreateEventoResponseDTO {
    success: boolean;
    evento?: {
        evento_id: number;
        titulo: string;
        descripcion_corta: string;
        descripcion_larga?: string;
        fecha_evento: string;
        fecha_creacion_evento: string;
        hora: string;
        tipo_evento: "publico" | "privado";
        ubicacion?: string;
        latitud?: string;
        longitud?: string;
        ciudad?: string;
        distrito?: string;
        url_direccion?: string;
        url_recurso?: string;
        estado_evento: "pendiente" | "rechazado" | "activo" | "vencido";
        categoria_id?: number;
    };
    message?: string;
}