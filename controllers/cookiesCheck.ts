import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import UsuarioDAO from "../DAO/usuario";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";

class CookiesController {

    static async checkStatus(req: Request, res: Response): Promise<Response> {
        try {
            const rawAuth = req.headers.authorization;
            const bearer = rawAuth && rawAuth.startsWith("Bearer ")
                ? rawAuth.slice(7)
                : undefined;

            const token = (req as any).cookies?.token || bearer;

            if (!token) {
                return res.status(401).json({
                    success: false,
                    message: "No autenticado"
                });
            }

            let decoded: any;
            try {
                decoded = jwt.verify(token, JWT_SECRET);
            } catch (e) {
                return res.status(401).json({
                    success: false,
                    message: "Token inválido"
                });
            }

            const user = await UsuarioDAO.findOne(decoded.usuario_id);

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            if (!user.activo) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario inactivo"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Usuario activo",
                data: {
                    activo: user.activo,
                    usuario_id: user.usuario_id,
                    rol: user.rol
                }
            });

        } catch (error) {
            console.error("Error al verificar estado:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }


}

export default CookiesController;
