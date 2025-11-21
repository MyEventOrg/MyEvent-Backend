// JUAN-MODIFICACION: Servicio de invitaciones (HU40 y HU41)

import InvitacionDAO from "../DAO/invitacion";
import UsuarioDAO from "../DAO/usuario";
import EventoDAO from "../DAO/evento";
import NotificacionDAO from "../DAO/notificacion";
import ParticipacionDAO from "../DAO/participacion";
import { validarCorreo, eliminarDuplicados } from "../helpers/invitacionHelper";

export interface EnviarInvitacionesResult {
  success: boolean;
  message: string;
  invitaciones_enviadas: number;
  correos_no_encontrados: string[];
  correos_ya_participan: string[];
  correos_ya_invitados: string[];
  correos_rechazaron: string[]; // JUAN-MODIFICACION: Usuarios que rechazaron anteriormente
}

export interface EnviarInvitacionesDTO {
  evento_id: number;
  organizador_id: number;
  correos: string[];
  mensaje?: string;
}

export interface ResponderInvitacionResult {
  success: boolean;
  message: string;
  participacion_creada?: boolean;
}

class InvitacionService {

  async enviarInvitaciones(data: EnviarInvitacionesDTO): Promise<EnviarInvitacionesResult> {
    try {
      const evento = await EventoDAO.findOne(data.evento_id);
      if (!evento) {
        return this.errorResponse("Evento no encontrado");
      }

      const correosSinDuplicados = eliminarDuplicados(data.correos);
      const correosValidos = correosSinDuplicados.filter(c => validarCorreo(c));

      if (correosValidos.length === 0) {
        return this.errorResponse("No hay correos válidos para invitar");
      }

      const organizador = await UsuarioDAO.findOne(data.organizador_id);
      const organizadorNombre = organizador?.get("nombreCompleto") || "Un organizador";
      const eventoTitulo = evento.get("titulo") as string;

      const resultado = {
        invitaciones_enviadas: 0,
        correos_no_encontrados: [] as string[],
        correos_ya_participan: [] as string[],
        correos_ya_invitados: [] as string[],
        correos_rechazaron: [] as string[], // JUAN-MODIFICACION: Usuarios que rechazaron
        correos_mismo_organizador: [] as string[] // JUAN-MODIFICACION: Nueva validación
      };

      for (const correo of correosValidos) {
        const usuario = await UsuarioDAO.findByEmail(correo);
        if (!usuario) {
          resultado.correos_no_encontrados.push(correo);
          continue;
        }

        const usuario_id = usuario.get("usuario_id") as number;

        // JUAN-MODIFICACION: Validar que no sea el mismo organizador
        if (usuario_id === data.organizador_id) {
          resultado.correos_mismo_organizador.push(correo);
          continue;
        }

        // JUAN-MODIFICACION: Verificar si ya existe una invitación
        const invitacionExistente = await InvitacionDAO.findByEventoAndUsuario(data.evento_id, usuario_id);
        if (invitacionExistente) {
          const estado = invitacionExistente.get("estado") as string;
          
          // Si ya tiene invitación pendiente, no hacer nada
          if (estado === "pendiente") {
            resultado.correos_ya_invitados.push(correo);
            continue;
          }
          
          // Si rechazó anteriormente, bloquear permanentemente
          if (estado === "rechazada") {
            resultado.correos_rechazaron.push(correo);
            continue;
          }
          
          // Si aceptó, verificar si sigue participando
          if (estado === "aceptada") {
            const participacionExistente = await ParticipacionDAO.findByEventoAndUsuario(data.evento_id, usuario_id);
            
            // Si aún participa, no se puede re-invitar
            if (participacionExistente && participacionExistente.length > 0) {
              resultado.correos_ya_participan.push(correo);
              continue;
            }
            
            // Si anuló asistencia, actualizar la invitación existente a pendiente
            await InvitacionDAO.update(invitacionExistente.get("invitacion_id") as number, {
              estado: "pendiente",
              mensaje: data.mensaje || null,
              fecha_invitacion: new Date()
            });

            // Eliminar notificaciones antiguas de invitación para este usuario y evento
            const notificacionesAntiguas = await NotificacionDAO.findInvitacionesByUsuarioYEvento(usuario_id, data.evento_id);
            for (const notif of notificacionesAntiguas) {
              await NotificacionDAO.remove(notif.get("notificacion_id"));
            }

            const mensajeNotif = data.mensaje 
              ? `${organizadorNombre} te invitó como asistente al evento "${eventoTitulo}". Mensaje: "${data.mensaje}"`
              : `${organizadorNombre} te invitó como asistente al evento "${eventoTitulo}".`;

            await NotificacionDAO.create({
              usuario_id: usuario_id,
              evento_id: data.evento_id,
              mensaje: mensajeNotif,
              visto: false,
              tipo: 'invitacion',
              fecha_creacion: new Date()
            });

            resultado.invitaciones_enviadas++;
            continue;
          }
        }

        // JUAN-MODIFICACION: Validar participación existente
        const participacionExistente = await ParticipacionDAO.findByEventoAndUsuario(data.evento_id, usuario_id);
        if (participacionExistente && participacionExistente.length > 0) {
          resultado.correos_ya_participan.push(correo);
          continue;
        }

        // Crear invitación con botones Aceptar/Rechazar (solo si no existe ninguna)
        await InvitacionDAO.create({
          organizador_id: data.organizador_id,
          invitado_id: usuario_id,
          evento_id: data.evento_id,
          mensaje: data.mensaje || null,
          estado: "pendiente",
          fecha_invitacion: new Date()
        });

        const mensajeNotif = data.mensaje 
          ? `${organizadorNombre} te invitó como asistente al evento "${eventoTitulo}". Mensaje: "${data.mensaje}"`
          : `${organizadorNombre} te invitó como asistente al evento "${eventoTitulo}".`;

        // Notificación con botones Aceptar/Rechazar (tipo 'invitacion')
        await NotificacionDAO.create({
          usuario_id: usuario_id,
          evento_id: data.evento_id,
          mensaje: mensajeNotif,
          visto: false,
          tipo: 'invitacion',
          fecha_creacion: new Date()
        });

        resultado.invitaciones_enviadas++;
      }

      const mensajes = [];
      if (resultado.invitaciones_enviadas > 0) {
        mensajes.push(`${resultado.invitaciones_enviadas} invitación(es) enviada(s)`);
      }
      if (resultado.correos_no_encontrados.length > 0) {
        mensajes.push(`${resultado.correos_no_encontrados.length} correo(s) no registrado(s)`);
      }
      if (resultado.correos_ya_participan.length > 0) {
        mensajes.push(`${resultado.correos_ya_participan.length} usuario(s) ya participa(n)`);
      }
      if (resultado.correos_ya_invitados.length > 0) {
        mensajes.push(`${resultado.correos_ya_invitados.length} ya tenía(n) invitación pendiente`);
      }
      // JUAN-MODIFICACION: Mensaje para usuarios que rechazaron
      if (resultado.correos_rechazaron.length > 0) {
        mensajes.push(`${resultado.correos_rechazaron.length} rechazó(aron) anteriormente (no se puede re-invitar)`);
      }
      // JUAN-MODIFICACION: Mensaje para organizador intentando invitarse a sí mismo
      if (resultado.correos_mismo_organizador.length > 0) {
        mensajes.push(`${resultado.correos_mismo_organizador.length} es el organizador (no puede invitarse a sí mismo)`);
      }

      return {
        success: resultado.invitaciones_enviadas > 0,
        message: mensajes.join(". "),
        ...resultado
      };

    } catch (error) {
      console.error("Error en enviarInvitaciones:", error);
      return this.errorResponse("Error interno al enviar invitaciones");
    }
  }

  private errorResponse(message: string): EnviarInvitacionesResult {
    return {
      success: false,
      message,
      invitaciones_enviadas: 0,
      correos_no_encontrados: [],
      correos_ya_participan: [],
      correos_ya_invitados: [],
      correos_rechazaron: []
    };
  }

  async responderInvitacion(
    invitacion_id: number,
    usuario_id: number,
    accion: "aceptar" | "rechazar"
  ): Promise<ResponderInvitacionResult> {
    try {
      const invitacion = await InvitacionDAO.findOne(invitacion_id);
      if (!invitacion) {
        return { success: false, message: "Invitación no encontrada" };
      }

      if (invitacion.get("estado") !== "pendiente") {
        return { success: false, message: "Esta invitación ya fue respondida" };
      }

      const evento_id = invitacion.get("evento_id") as number;
      const tipo = invitacion.get("tipo") as string;

      // JUAN-MODIFICACION: Diferenciar entre invitación normal y solicitud
      if (tipo === "solicitud") {
        // Es una solicitud de asistencia - quien responde debe ser org/coorg
        const participacion = await ParticipacionDAO.findByEventoAndUsuario(evento_id, usuario_id);
        
        if (!participacion || participacion.length === 0) {
          return { success: false, message: "No tienes permisos para responder esta solicitud" };
        }

        const rolUsuario = participacion[0].get("rol_evento") as string;
        if (rolUsuario !== "organizador") {
          return { success: false, message: "Solo el organizador puede responder solicitudes" };
        }

        const solicitante_id = invitacion.get("organizador_id") as number; // Invertido en solicitudes

        if (accion === "aceptar") {
          // Verificar si ya participa
          const participacionExistente = await ParticipacionDAO.findByEventoAndUsuario(evento_id, solicitante_id);

          if (participacionExistente && participacionExistente.length > 0) {
            await InvitacionDAO.update(invitacion_id, { estado: "aceptada" });
            return { success: true, message: "El usuario ya participa en el evento", participacion_creada: false };
          }

          // Crear participación del solicitante
          await ParticipacionDAO.create({
            usuario_id: solicitante_id,
            evento_id,
            rol_evento: "asistente",
            fecha_registro: new Date()
          });

          await InvitacionDAO.update(invitacion_id, { estado: "aceptada" });

          // Notificar al solicitante
          const evento = await EventoDAO.findOne(evento_id);
          await NotificacionDAO.create({
            usuario_id: solicitante_id,
            evento_id,
            mensaje: `Tu solicitud para el evento "${evento?.get("titulo")}" fue aceptada. ¡Ya eres parte del evento!`,
            visto: false,
            tipo: 'normal',
            fecha_creacion: new Date()
          });

          return { success: true, message: "Solicitud aceptada. El usuario ahora es parte del evento", participacion_creada: true };
        } else {
          await InvitacionDAO.update(invitacion_id, { estado: "rechazada" });

          // Notificar al solicitante del rechazo
          const evento = await EventoDAO.findOne(evento_id);
          await NotificacionDAO.create({
            usuario_id: solicitante_id,
            evento_id,
            mensaje: `Tu solicitud para el evento "${evento?.get("titulo")}" fue rechazada.`,
            visto: false,
            tipo: 'normal',
            fecha_creacion: new Date()
          });

          return { success: true, message: "Solicitud rechazada" };
        }

      } else {
        // Es una invitación normal - quien responde es el invitado
        const invitado_id = invitacion.get("invitado_id") as number;

        if (invitado_id !== usuario_id) {
          return { success: false, message: "No tienes permisos para responder esta invitación" };
        }

        if (accion === "aceptar") {
          const participacionExistente = await ParticipacionDAO.findByEventoAndUsuario(evento_id, invitado_id);

          if (participacionExistente && participacionExistente.length > 0) {
            await InvitacionDAO.update(invitacion_id, { estado: "aceptada" });
            return { success: true, message: "Ya estabas participando en este evento", participacion_creada: false };
          }

          await ParticipacionDAO.create({
            usuario_id: invitado_id,
            evento_id,
            rol_evento: "asistente",
            fecha_registro: new Date()
          });

          await InvitacionDAO.update(invitacion_id, { estado: "aceptada" });
          return { success: true, message: "Invitación aceptada. Ahora eres parte del evento", participacion_creada: true };
        } else {
          await InvitacionDAO.update(invitacion_id, { estado: "rechazada" });
          return { success: true, message: "Invitación rechazada" };
        }
      }

    } catch (error) {
      console.error("Error en responderInvitacion:", error);
      return { success: false, message: "Error interno al responder invitación" };
    }
  }

  async obtenerSugeridos(organizador_id: number): Promise<string[]> {
    try {
      return await InvitacionDAO.findCorreosSugeridosByOrganizador(organizador_id);
    } catch (error) {
      console.error("Error en obtenerSugeridos:", error);
      return [];
    }
  }
}

export default InvitacionService;
