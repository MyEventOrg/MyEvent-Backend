import { Request, Response } from "express";
import UsuarioDAO from "../DAO/usuario";
import jwt from "jsonwebtoken";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";

class UsuarioController {
  static async getusuarioById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const usuario = await UsuarioDAO.findOne(Number(id));

      if (!usuario) {
        return res.status(404).json({
          success: false,
          message: `No se encontró usuario con id ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: usuario,
      });
    } catch (error) {
      console.error("Error en getusuarioById:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el usuario",
      });
    }
  }

  static async iniciarSesion(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const usuario = await UsuarioDAO.findByEmail(email);

      if (!usuario || usuario.contrasena !== password) {
        return res.status(404).json({
          success: false,
          message: "Usuario o contraseña errónea",
        });
      }
      const payload = {
        usuario_id: usuario.usuario_id,
        apodo: usuario.apodo,
        rol: usuario.rol,
      };

      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });

      res.cookie("token", token, {
        httpOnly: false,
        secure: false,
      });

      return res.status(200).json({
        success: true,
        message: "Inicio de sesión exitoso",
        token,
      });
    } catch (error) {
      console.error("Error en iniciarSesion:", error);
      return res.status(500).json({
        success: false,
        message: "Error en el servidor al iniciar sesión",
      });
    }
  }
  static async cerrarSesion(req: Request, res: Response) {
    try {
      res.clearCookie("token", {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
      });

      return res.status(200).json({
        success: true,
        message: "Sesión cerrada",
      });
    } catch (error) {
      console.error("Error en cerrarSesion:", error);
      return res.status(500).json({
        success: false,
        message: "No se pudo cerrar sesión",
      });
    }
  }
}

export default UsuarioController;
