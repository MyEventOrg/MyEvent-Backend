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

      const token = jwt.sign(payload, JWT_SECRET);

      res.cookie("token", token, {
        httpOnly: false,
        secure: false,
        sameSite: "lax",
        path: "/",
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
  static async crearUsuario(req: Request, res: Response) {
    try {
      const { nombres, apellidos, apodo, email, password } = req.body;

      const nombreCompleto = `${nombres} ${apellidos}`;

      const fecha = new Date();
      const fechaActual = fecha.toLocaleDateString("sv-SE");
      const nuevoUsuario = await UsuarioDAO.create({
        nombreCompleto,
        correo: email,
        contrasena: password,
        fecha_registro: fechaActual,
        activo: 1,
        rol: "user",
        apodo,
      });

      return res.status(201).json({
        success: true,
        message: "Usuario creado exitosamente",
        data: nuevoUsuario,
      });
    } catch (error) {
      console.error("Error en crearUsuario:", error);
      return res.status(500).json({
        success: false,
        message: "Error en el servidor al crear usuario",
      });
    }
  }
  static async getUsuarios(req: Request, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = 10;
      const search = (req.query.search as string) || "";

      const result = await UsuarioDAO.findPaginatedUsers(page, limit, search);

      return res.json({
        data: result.data,
        page: result.page,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error al obtener usuarios" });
    }
  }

  static async changeActivation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { activo } = req.body;

      if (activo !== 0 && activo !== 1) {
        return res.status(400).json({ error: "El estado activo debe ser 0 o 1" });
      }

      const updatedUser = await UsuarioDAO.update(Number(id), { activo });

      if (!updatedUser) {
        return res.status(404).json({ error: "Usuario no encontrado" });
      }

      return res.json({
        success: true,
        message: `Usuario ${id} actualizado correctamente`,
        data: updatedUser,
      });
    } catch (error) {
      console.error("Error al cambiar estado de usuario:", error);
      return res.status(500).json({ error: "Error interno al cambiar estado" });
    }
  }
}

export default UsuarioController;
