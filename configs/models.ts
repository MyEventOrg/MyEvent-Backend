import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "./db";

/* =========================================================
 * USUARIO
 * =======================================================*/
export interface UsuarioAttributes {
  usuario_id: number;
  nombreCompleto: string;
  correo: string;
  contrasena: string;
  fecha_registro: Date;
  activo: boolean;
  rol: string;         // ej: 'admin' | 'user'
  apodo?: string | null;
  url_imagen?: string | null;
}
export type UsuarioCreationAttributes = Optional<UsuarioAttributes, "usuario_id" | "apodo" | "url_imagen">;

export class Usuario
  extends Model<UsuarioAttributes, UsuarioCreationAttributes>
  implements UsuarioAttributes {
  public usuario_id!: number;
  public nombreCompleto!: string;
  public correo!: string;
  public contrasena!: string;
  public fecha_registro!: Date;
  public activo!: boolean;
  public rol!: string;
  public apodo?: string | null;
  public url_imagen?: string | null;
}

Usuario.init(
  {
    usuario_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombreCompleto: { type: DataTypes.STRING(40), allowNull: false },
    correo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
    contrasena: { type: DataTypes.STRING(200), allowNull: false },
    fecha_registro: { type: DataTypes.DATE, allowNull: false },
    activo: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    rol: { type: DataTypes.STRING(5), allowNull: false },
    apodo: { type: DataTypes.STRING(12), allowNull: true },
    url_imagen: { type: DataTypes.STRING(300), allowNull: true },
  },
  { sequelize, tableName: "Usuario", timestamps: false }
);

/* =========================================================
 * CATEGORIA
 * =======================================================*/
export interface CategoriaAttributes {
  categoria_id: number;
  nombre: string;
}
export type CategoriaCreationAttributes = Optional<CategoriaAttributes, "categoria_id">;

export class Categoria
  extends Model<CategoriaAttributes, CategoriaCreationAttributes>
  implements CategoriaAttributes {
  public categoria_id!: number;
  public nombre!: string;
}

Categoria.init(
  {
    categoria_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    nombre: { type: DataTypes.STRING(40), allowNull: false },
  },
  { sequelize, tableName: "Categoria", timestamps: false }
);

/* =========================================================
 * EVENTO
 * =======================================================*/

export interface EventoAttributes {
  evento_id: number;
  titulo: string;
  descripcion_corta: string;
  descripcion_larga?: string | null;
  fecha_evento: Date;
  fecha_creacion_evento: Date;
  hora: string;
  url_imagen?: string | null;
  tipo_evento: "publico" | "privado";
  ubicacion?: string | null;
  latitud?: string | null;
  longitud?: string | null;
  ciudad?: string | null;
  distrito?: string | null;
  url_direccion?: string | null;
  url_recurso?: string | null;
  estado_evento: "pendiente" | "rechazado" | "activo" | "vencido";
  categoria_id?: number | null; // FK
}

export type EventoCreationAttributes = Optional<
  EventoAttributes,
  | "evento_id"
  | "descripcion_larga"
  | "url_imagen"
  | "ubicacion"
  | "latitud"
  | "longitud"
  | "ciudad"
  | "distrito"
  | "url_direccion"
  | "url_recurso"
  | "categoria_id"
  | "fecha_creacion_evento"
>;

export class Evento
  extends Model<EventoAttributes, EventoCreationAttributes>
  implements EventoAttributes {
  public evento_id!: number;
  public titulo!: string;
  public descripcion_corta!: string;
  public descripcion_larga?: string | null;
  public fecha_evento!: Date;
  public fecha_creacion_evento!: Date;
  public hora!: string;
  public url_imagen?: string | null;
  public tipo_evento!: "publico" | "privado";
  public ubicacion?: string | null;
  public latitud?: string | null;
  public longitud?: string | null;
  public ciudad?: string | null;
  public distrito?: string | null;
  public url_direccion?: string | null;
  public url_recurso?: string | null;
  public estado_evento!: "pendiente" | "rechazado" | "activo" | "vencido";
  public categoria_id?: number | null;
}

Evento.init(
  {
    evento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    titulo: { type: DataTypes.STRING(60), allowNull: false },
    descripcion_corta: { type: DataTypes.STRING(200), allowNull: false },
    descripcion_larga: { type: DataTypes.TEXT, allowNull: true },
    fecha_evento: { type: DataTypes.DATEONLY, allowNull: false },
    fecha_creacion_evento: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW }, // 👈 agregado
    hora: { type: DataTypes.STRING(10), allowNull: false },
    url_imagen: { type: DataTypes.STRING(300), allowNull: true },
    tipo_evento: { type: DataTypes.ENUM("publico", "privado"), allowNull: false },
    ubicacion: { type: DataTypes.STRING(200), allowNull: true },
    latitud: { type: DataTypes.STRING(40), allowNull: true },
    longitud: { type: DataTypes.STRING(40), allowNull: true },
    ciudad: { type: DataTypes.STRING(100), allowNull: true },
    distrito: { type: DataTypes.STRING(100), allowNull: true },
    url_direccion: { type: DataTypes.STRING(300), allowNull: true },
    url_recurso: { type: DataTypes.STRING(300), allowNull: true },
    estado_evento: {
      type: DataTypes.ENUM("pendiente", "rechazado", "activo", "vencido"),
      allowNull: false,
      defaultValue: "pendiente"
    },
    categoria_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "Categoria", key: "categoria_id" }
    },
  },
  { sequelize, tableName: "Evento", timestamps: false }
);


/* =========================================================
 * PARTICIPACION
 * =======================================================*/
export interface ParticipacionAttributes {
  participacion_id: number;
  fecha_registro: Date;
  fecha_actualizada?: Date | null;
  rol_evento: string; // organizador | asistente | ...
  usuario_id: number; // FK
  evento_id: number;  // FK
}
export type ParticipacionCreationAttributes = Optional<ParticipacionAttributes, "participacion_id" | "fecha_actualizada">;

export class Participacion
  extends Model<ParticipacionAttributes, ParticipacionCreationAttributes>
  implements ParticipacionAttributes {
  public participacion_id!: number;
  public fecha_registro!: Date;
  public fecha_actualizada?: Date | null;
  public rol_evento!: string;
  public usuario_id!: number;
  public evento_id!: number;
}

Participacion.init(
  {
    participacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    fecha_registro: { type: DataTypes.DATE, allowNull: false },
    fecha_actualizada: { type: DataTypes.DATE, allowNull: true },
    rol_evento: { type: DataTypes.STRING(20), allowNull: false },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    evento_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "Participacion", timestamps: false }
);

/* =========================================================
 * INVITACION
 * =======================================================*/
export type InvitacionEstado = "pendiente" | "aceptada" | "rechazada";

export interface InvitacionAttributes {
  invitacion_id: number;
  estado: InvitacionEstado;
  mensaje?: string | null;
  fecha_invitacion: Date;
  organizador_id: number; // FK Usuario
  invitado_id: number;    // FK Usuario
  evento_id: number;      // FK Evento
}
export type InvitacionCreationAttributes = Optional<InvitacionAttributes, "invitacion_id" | "mensaje">;

export class Invitacion
  extends Model<InvitacionAttributes, InvitacionCreationAttributes>
  implements InvitacionAttributes {
  public invitacion_id!: number;
  public estado!: InvitacionEstado;
  public mensaje?: string | null;
  public fecha_invitacion!: Date;
  public organizador_id!: number;
  public invitado_id!: number;
  public evento_id!: number;
}

Invitacion.init(
  {
    invitacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    estado: { type: DataTypes.ENUM("pendiente", "aceptada", "rechazada"), allowNull: false, defaultValue: "pendiente" },
    mensaje: { type: DataTypes.STRING(200), allowNull: true },
    fecha_invitacion: { type: DataTypes.DATE, allowNull: false },
    organizador_id: { type: DataTypes.INTEGER, allowNull: false },
    invitado_id: { type: DataTypes.INTEGER, allowNull: false },
    evento_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "Invitacion", timestamps: false }
);

/* =========================================================
 * EVENTOS GUARDADO
 * =======================================================*/
export interface EventosGuardadoAttributes {
  eventosguardado_id: number;
  usuario_id: number; // FK
  evento_id: number;  // FK
}
export type EventosGuardadoCreationAttributes = Optional<EventosGuardadoAttributes, "eventosguardado_id">;

export class EventosGuardado
  extends Model<EventosGuardadoAttributes, EventosGuardadoCreationAttributes>
  implements EventosGuardadoAttributes {
  public eventosguardado_id!: number;
  public usuario_id!: number;
  public evento_id!: number;
}

EventosGuardado.init(
  {
    eventosguardado_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    evento_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "EventosGuardado", timestamps: false }
);

/* =========================================================
 * COMENTARIO EVENTO
 * =======================================================*/
export interface ComentarioEventoAttributes {
  comentarioevento_id: number;
  mensaje: string;
  likes: number;
  dislikes: number;
  usuario_id: number; // FK
  evento_id: number;  // FK
}
export type ComentarioEventoCreationAttributes = Optional<ComentarioEventoAttributes, "comentarioevento_id" | "likes" | "dislikes">;

export class ComentarioEvento
  extends Model<ComentarioEventoAttributes, ComentarioEventoCreationAttributes>
  implements ComentarioEventoAttributes {
  public comentarioevento_id!: number;
  public mensaje!: string;
  public likes!: number;
  public dislikes!: number;
  public usuario_id!: number;
  public evento_id!: number;
}

ComentarioEvento.init(
  {
    comentarioevento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    mensaje: { type: DataTypes.STRING(200), allowNull: false },
    likes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    dislikes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
    usuario_id: { type: DataTypes.INTEGER, allowNull: false },
    evento_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { sequelize, tableName: "ComentarioEvento", timestamps: false }
);

/* =========================================================
 * RELACIONES
 * =======================================================*/
// Evento - Categoria
Categoria.hasMany(Evento, { foreignKey: "categoria_id" });
Evento.belongsTo(Categoria, { foreignKey: "categoria_id" });

// Usuario - Participacion - Evento
Usuario.hasMany(Participacion, { foreignKey: "usuario_id" });
Participacion.belongsTo(Usuario, { foreignKey: "usuario_id" });

Evento.hasMany(Participacion, { foreignKey: "evento_id" });
Participacion.belongsTo(Evento, { foreignKey: "evento_id" });

// Usuario - Invitacion - Evento
Usuario.hasMany(Invitacion, { foreignKey: "organizador_id", as: "InvitacionesEnviadas" });
Usuario.hasMany(Invitacion, { foreignKey: "invitado_id", as: "InvitacionesRecibidas" });
Invitacion.belongsTo(Usuario, { foreignKey: "organizador_id", as: "Organizador" });
Invitacion.belongsTo(Usuario, { foreignKey: "invitado_id", as: "Invitado" });

Evento.hasMany(Invitacion, { foreignKey: "evento_id" });
Invitacion.belongsTo(Evento, { foreignKey: "evento_id" });

// Usuario - EventosGuardado - Evento
Usuario.hasMany(EventosGuardado, { foreignKey: "usuario_id" });
EventosGuardado.belongsTo(Usuario, { foreignKey: "usuario_id" });

Evento.hasMany(EventosGuardado, { foreignKey: "evento_id" });
EventosGuardado.belongsTo(Evento, { foreignKey: "evento_id" });

// Usuario - ComentarioEvento - Evento
Usuario.hasMany(ComentarioEvento, { foreignKey: "usuario_id" });
ComentarioEvento.belongsTo(Usuario, { foreignKey: "usuario_id" });

Evento.hasMany(ComentarioEvento, { foreignKey: "evento_id" });
ComentarioEvento.belongsTo(Evento, { foreignKey: "evento_id" });

/* =========================================================
 * EXPORT
 * =======================================================*/
export const db = {
  sequelize,
  Usuario,
  Categoria,
  Evento,
  Participacion,
  Invitacion,
  EventosGuardado,
  ComentarioEvento,
};
