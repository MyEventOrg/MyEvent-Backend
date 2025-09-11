import { DataTypes, Model } from "sequelize";
import sequelize from "./db";

// MODELOSS
export class Usuario extends Model {}
Usuario.init({
  usuario_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  clave: { type: DataTypes.STRING(20), allowNull: false },
  correo: { type: DataTypes.STRING(30), allowNull: false, unique: true },
}, { sequelize, tableName: "Usuario", timestamps: false });

export class Rol extends Model {}
Rol.init({
  rol_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(20), allowNull: false },
}, { sequelize, tableName: "Rol", timestamps: false });

export class EstadoEvento extends Model {}
EstadoEvento.init({
  estado_evento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(20), allowNull: false },
}, { sequelize, tableName: "EstadoEvento", timestamps: false });

export class Privacidad extends Model {}
Privacidad.init({
  privacidad_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(20), allowNull: false },
}, { sequelize, tableName: "Privacidad", timestamps: false });

export class EstadoInvitacion extends Model {}
EstadoInvitacion.init({
  estado_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(20), allowNull: false },
}, { sequelize, tableName: "EstadoInvitacion", timestamps: false });

export class Evento extends Model {}
Evento.init({
  evento_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  titulo: { type: DataTypes.STRING(30), allowNull: false },
  descripcion: { type: DataTypes.STRING(300) },
  fechaHora: { type: DataTypes.DATE, allowNull: false },
  imagen: { type: DataTypes.STRING(200) },
}, { sequelize, tableName: "Evento", timestamps: false });

export class Cliente extends Model {}
Cliente.init({
  cliente_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(50), allowNull: false },
  apellido: { type: DataTypes.STRING(50), allowNull: false },
  fotoPerfil: { type: DataTypes.STRING(200) },
}, { sequelize, tableName: "Cliente", timestamps: false });

export class Participante extends Model {}
Participante.init({
  participante_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING(20), allowNull: false },
}, { sequelize, tableName: "Participante", timestamps: false });

export class Ubicacion extends Model {}
Ubicacion.init({
  ubicacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  direccion: { type: DataTypes.STRING(200) },
  latitud: { type: DataTypes.DOUBLE },
  longitud: { type: DataTypes.DOUBLE },
  es_principal: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: "Ubicacion", timestamps: false });

export class EventoParticipante extends Model {}
EventoParticipante.init({
  evento_participante_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
}, { sequelize, tableName: "EventoParticipante", timestamps: false });

export class Notificacion extends Model {}
Notificacion.init({
  notificacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  mensaje: { type: DataTypes.STRING(200), allowNull: false },
  fechaHora: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { sequelize, tableName: "Notificacion", timestamps: false });

export class Invitacion extends Model {}
Invitacion.init({
  invitacion_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  confirmacion: { type: DataTypes.BOOLEAN, defaultValue: false },
}, { sequelize, tableName: "Invitacion", timestamps: false });

export class NotificacionCliente extends Model {}
NotificacionCliente.init({
  notificacion_usuario_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
}, { sequelize, tableName: "NotificacionCliente", timestamps: false });



// RELACIONES, Necesario en sequelizee

// Usuario - Cliente
Usuario.hasOne(Cliente, { foreignKey: "usuario_id" });
Cliente.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Usuario - Participante
Usuario.hasMany(Participante, { foreignKey: "usuario_id" });
Participante.belongsTo(Usuario, { foreignKey: "usuario_id" });

// Rol - Participante
Rol.hasMany(Participante, { foreignKey: "rol_id" });
Participante.belongsTo(Rol, { foreignKey: "rol_id" });

// Evento - EstadoEvento
EstadoEvento.hasMany(Evento, { foreignKey: "estado" });
Evento.belongsTo(EstadoEvento, { foreignKey: "estado" });

// Evento - Privacidad
Privacidad.hasMany(Evento, { foreignKey: "privacidad" });
Evento.belongsTo(Privacidad, { foreignKey: "privacidad" });

// Evento - Ubicacion
Evento.hasMany(Ubicacion, { foreignKey: "evento_id" });
Ubicacion.belongsTo(Evento, { foreignKey: "evento_id" });

// Evento - Notificacion
Evento.hasMany(Notificacion, { foreignKey: "evento_id" });
Notificacion.belongsTo(Evento, { foreignKey: "evento_id" });

// Evento - Participante (N:N) vía EventoParticipante
Evento.belongsToMany(Participante, { through: EventoParticipante, foreignKey: "evento_id" });
Participante.belongsToMany(Evento, { through: EventoParticipante, foreignKey: "participante_id" });

// Notificacion - Invitacion
Notificacion.hasMany(Invitacion, { foreignKey: "notificacion_id" });
Invitacion.belongsTo(Notificacion, { foreignKey: "notificacion_id" });

// EstadoInvitacion - Invitacion
EstadoInvitacion.hasMany(Invitacion, { foreignKey: "estado_invitacion_id" });
Invitacion.belongsTo(EstadoInvitacion, { foreignKey: "estado_invitacion_id" });

// Notificacion - NotificacionCliente
Notificacion.hasMany(NotificacionCliente, { foreignKey: "notificacion_id" });
NotificacionCliente.belongsTo(Notificacion, { foreignKey: "notificacion_id" });

// Cliente - NotificacionCliente
Cliente.hasMany(NotificacionCliente, { foreignKey: "cliente_id" });
NotificacionCliente.belongsTo(Cliente, { foreignKey: "cliente_id" });


export const db = {
  sequelize,
  Usuario,
  Rol,
  EstadoEvento,
  Privacidad,
  EstadoInvitacion,
  Evento,
  Cliente,
  Participante,
  Ubicacion,
  EventoParticipante,
  Notificacion,
  Invitacion,
  NotificacionCliente,
};
