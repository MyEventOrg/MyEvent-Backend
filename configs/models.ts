import { DataTypes, Model } from "sequelize";
import sequelize from "./db";

// ==========================
// MODELOS
// ==========================

export class Usuario extends Model {}
Usuario.init({
  usuario_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombreCompleto: { type: DataTypes.STRING(40), allowNull: false },
  correo: { type: DataTypes.STRING(40), allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING(200), allowNull: false },
  fecha_registro: { type: DataTypes.DATE, allowNull: false },
  activo: { type: DataTypes.BOOLEAN, defaultValue: true },
  rol: { type: DataTypes.STRING(5), allowNull: false },
  apodo: { type: DataTypes.STRING(12) }
}, { sequelize, tableName: "Usuario", timestamps: false });

export class Categoria extends Model {}
Categoria.init({
  categoria_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(40), allowNull: false }
}, { sequelize, tableName: "Categoria", timestamps: false });

export class Evento extends Model {}
Evento.init({
  evento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo: { type: DataTypes.STRING(60), allowNull: false },
  descripcion_corta: { type: DataTypes.STRING(200), allowNull: false },
  descripcion_larga: { type: DataTypes.TEXT },
  fecha_evento: { type: DataTypes.DATE, allowNull: false },
  hora: { type: DataTypes.STRING(10), allowNull: false },
  url_imagen: { type: DataTypes.STRING(200) },
  tipo_evento: { type: DataTypes.STRING(7), allowNull: false }, // publico/privado
  ubicacion: { type: DataTypes.STRING(200) },
  latitud: { type: DataTypes.STRING(40) },
  longitud: { type: DataTypes.STRING(40) },
  ciudad: { type: DataTypes.STRING(20) },
  distrito: { type: DataTypes.STRING(20) },
  url_direccion: { type: DataTypes.STRING(200) },
  url_recurso: { type: DataTypes.STRING(200) },
  estado_evento: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, tableName: "Evento", timestamps: false });

export class Participacion extends Model {}
Participacion.init({
  participacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  fecha_registro: { type: DataTypes.DATE, allowNull: false },
  fecha_actualizada: { type: DataTypes.DATE },
  rol_evento: { type: DataTypes.STRING(20), allowNull: false } // organizador, asistente, etc.
}, { sequelize, tableName: "Participacion", timestamps: false });

export class Invitacion extends Model {}
Invitacion.init({
  invitacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  estado: { type: DataTypes.ENUM("pendiente", "aceptada", "rechazada"), defaultValue: "pendiente" },
  mensaje: { type: DataTypes.STRING(200) },
  fecha_invitacion: { type: DataTypes.DATE, allowNull: false }
}, { sequelize, tableName: "Invitacion", timestamps: false });

export class EventosGuardado extends Model {}
EventosGuardado.init({
  eventosguardado_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true }
}, { sequelize, tableName: "EventosGuardado", timestamps: false });

export class ComentarioEvento extends Model {}
ComentarioEvento.init({
  comentarioevento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  mensaje: { type: DataTypes.STRING(200), allowNull: false },
  likes: { type: DataTypes.INTEGER, defaultValue: 0 },
  dislikes: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { sequelize, tableName: "ComentarioEvento", timestamps: false });


// ==========================
// RELACIONES
// ==========================

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


// ==========================
// EXPORT
// ==========================
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
