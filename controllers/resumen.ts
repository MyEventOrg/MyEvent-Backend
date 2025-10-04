import UsuarioDAO from "../DAO/usuario";
import CategoriaDAO from "../DAO/categoria";
import ParticipacionDAO from "../DAO/participacion";
import EventosGuardadoDAO from "../DAO/eventosGuardado";
import EventoDAO from "../DAO/evento";
import { Request, Response } from "express";


class ResumenController {
    static async getMisEventosMisEventosAsistidosMisEventosGUardados(req: Request, res: Response) {
        try {
            const usuarioRaw = (req.params.usuarioId ?? req.params.id ?? req.query.usuarioId ?? req.body.usuario_id) as any;
            const usuario_id = Number(usuarioRaw);
            if (!usuario_id || Number.isNaN(usuario_id)) {
                return res.status(400).json({ ok: false, message: "usuario_id requerido y numérico." });
            }

            const [pCreados, pAsistiendo, guardados] = await Promise.all([
                ParticipacionDAO.findByUsuarioIdAndRoles(usuario_id, "organizador"),
                ParticipacionDAO.findByUsuarioIdAndRoles(usuario_id, ["asistente", "coorganizador"]),
                EventosGuardadoDAO.findByUsuarioId(usuario_id),
            ]);

            const uniq = (arr: number[]) => Array.from(new Set(arr));

            const creadosIds = uniq(pCreados.map(p => Number(p.evento_id)));
            const asistiendoIds = uniq(pAsistiendo.map(p => Number(p.evento_id)));
            const guardadosIds = uniq(guardados.map(g => Number(g.evento_id)));


            const [eventosCreados, eventosAsistiendo, eventosGuardados] = await Promise.all([
                EventoDAO.findByIdsActivos(creadosIds),
                EventoDAO.findByIdsActivos(asistiendoIds),
                EventoDAO.findByIdsActivos(guardadosIds),
            ]);

            return res.status(200).json({
                ok: true,
                usuario_id,
                totals: {
                    creados: eventosCreados.length,
                    asistiendo: eventosAsistiendo.length,
                    guardados: eventosGuardados.length,
                },
                data: { eventosCreados, eventosAsistiendo, eventosGuardados },
            });
        } catch (err) {
            console.error("getMisEventos* error:", err);
            return res.status(500).json({ ok: false, message: "Error interno." });
        }
    }
}
export default ResumenController;
