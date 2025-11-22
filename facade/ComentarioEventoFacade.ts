// src/facades/ComentarioEventoFacade.ts
import ComentarioEventoDAO from "../DAO/comentarioEvento";
import EventoDAO from "../DAO/evento";
import UsuarioDAO from "../DAO/usuario";

export default class ComentarioEventoFacade {

    // Obtener comentarios
    static async obtenerComentarios(evento_id: number) {
        const evento = await EventoDAO.findOne(evento_id);
        if (!evento) throw new Error("EVENTO_NO_EXISTE");

        return ComentarioEventoDAO.findByEventoId(evento_id);
    }

    // Crear comentario
    static async crearComentario(evento_id: number, usuario_id: number, mensaje: string) {
        if (!mensaje || mensaje.trim().length === 0)
            throw new Error("MENSAJE_VACIO");

        if (mensaje.length > 200)
            throw new Error("MENSAJE_LARGO");

        const evento = await EventoDAO.findOne(evento_id);
        if (!evento) throw new Error("EVENTO_NO_EXISTE");

        if (evento.estado_evento !== "activo")
            throw new Error("EVENTO_NO_ACTIVO");

        const usuario = await UsuarioDAO.findOne(usuario_id);
        if (!usuario) throw new Error("USUARIO_NO_EXISTE");

        const nuevo = await ComentarioEventoDAO.create({
            evento_id,
            usuario_id,
            mensaje: mensaje.trim()
        });

        return nuevo;
    }

    // Like / Unlike
    static async actualizarLikes(comentario_id: number, action: "like" | "unlike") {
        const comentario = await ComentarioEventoDAO.findOne(comentario_id);
        if (!comentario) throw new Error("COMENTARIO_NO_EXISTE");

        const likes = action === "like"
            ? comentario.likes + 1
            : Math.max(0, comentario.likes - 1);
        await ComentarioEventoDAO.update(comentario_id, { likes });

        return likes;
    }

    // Dislike / Undislike
    static async actualizarDislikes(comentario_id: number, action: "dislike" | "undislike") {
        const comentario = await ComentarioEventoDAO.findOne(comentario_id);
        if (!comentario) throw new Error("COMENTARIO_NO_EXISTE");

        const dislikes =
            action === "dislike" ? comentario.dislikes + 1 : Math.max(0, comentario.dislikes - 1);

        await ComentarioEventoDAO.update(comentario_id, { dislikes });

        return dislikes;
    }

    // Eliminar comentario
    static async eliminarComentario(comentario_id: number, usuario_id: number) {
        const comentario = await ComentarioEventoDAO.findOne(comentario_id);
        if (!comentario) throw new Error("COMENTARIO_NO_EXISTE");

        if (comentario.usuario_id !== usuario_id)
            throw new Error("NO_AUTORIZADO");

        await ComentarioEventoDAO.remove(comentario_id);

        return true;
    }
}

