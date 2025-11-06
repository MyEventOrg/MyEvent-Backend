import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import UsuarioDAO from "../DAO/usuario";
import { FileUploadService } from "../helpers/fileUpload";
import { getUserFromRequest } from "../utils/authToken";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";

function signAndSetCookie(res: Response, payload: { usuario_id: number; apodo?: string | null; rol: string; url_imagen?: string | null; }) {
  const token = jwt.sign(payload, JWT_SECRET);
  res.cookie("token", token, {
    httpOnly: false,
    secure: false,
    sameSite: "lax",
    path: "/",
  });
  return token;
}

class PerfilController {
  static async getMiPerfil(req: Request, res: Response) {
    try {
      const { usuario_id } = getUserFromRequest(req);
      const usuario = await UsuarioDAO.findOne(usuario_id);
      if (!usuario) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado" });
      }
      const { contrasena, ...data } = (usuario as any).dataValues || usuario;
      return res.status(200).json({ success: true, data });
    } catch (error: any) {
      const status = error?.status || 500;
      const message = status === 401 ? error.message : "Error al obtener el perfil del usuario";
      return res.status(status).json({ success: false, message });
    }
  }

  static async updateMiPerfil(req: Request, res: Response) {
    try {
      const { usuario_id } = getUserFromRequest(req);
      const { nombreCompleto, apodo } = req.body;

      const actualizado = await UsuarioDAO.update(usuario_id, { nombreCompleto, apodo });
      if (!actualizado) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado, no se pudo actualizar" });
      }

      const apodoNuevo = (actualizado as any).get?.("apodo") ?? apodo ?? null;
      const rol = (actualizado as any).get?.("rol") ?? "user";
      const url_imagen = (actualizado as any).get?.("url_imagen") ?? null;

      signAndSetCookie(res, { usuario_id, apodo: apodoNuevo, rol, url_imagen });

      return res.status(200).json({ success: true, message: "Perfil actualizado exitosamente" });
    } catch (error: any) {
      const status = error?.status || 500;
      const message = status === 401 ? error.message : "Error al actualizar el perfil del usuario";
      return res.status(status).json({ success: false, message });
    }
  }

  static async updateImagenPerfil(req: Request, res: Response) {
    const multerSingle = FileUploadService.getImageMulterConfig().single("file");
    multerSingle(req, res, async (err: any) => {
      if (err) {
        return res.status(400).json({ success: false, message: err.message || "Error al procesar el archivo." });
      }
      try {
        const { usuario_id } = getUserFromRequest(req);
        if (!req.file) {
          return res.status(400).json({ success: false, message: "No se proporcionó ningún archivo de imagen." });
        }

        const uploadResult = await FileUploadService.uploadFile(req.file, "fotos_perfil");
        if (!uploadResult.success || !uploadResult.url) {
          return res.status(500).json({ success: false, message: uploadResult.message || "Error al subir la imagen." });
        }

        const actualizado = await UsuarioDAO.update(usuario_id, { url_imagen: uploadResult.url });
        if (!actualizado) {
          return res.status(404).json({ success: false, message: "Usuario no encontrado, la foto no se pudo guardar." });
        }

        const apodo = (actualizado as any).get?.("apodo") ?? null;
        const rol = (actualizado as any).get?.("rol") ?? "user";
        const url_imagen = uploadResult.url;
        signAndSetCookie(res, { usuario_id, apodo, rol, url_imagen });

        return res.status(200).json({ success: true, message: "Foto de perfil actualizada exitosamente", data: { url_imagen } });
      } catch (error: any) {
        const status = error?.status || 500;
        const message = status === 401 ? error.message : error.message || "Error al actualizar la foto de perfil.";
        return res.status(status).json({ success: false, message });
      }
    });
  }

  static async eliminarFotoPerfil(req: Request, res: Response) {
    try {
      const { usuario_id } = getUserFromRequest(req);
      const actualizado = await UsuarioDAO.update(usuario_id, { url_imagen: null });
      if (!actualizado) {
        return res.status(404).json({ success: false, message: "Usuario no encontrado, la foto no se pudo eliminar." });
      }
      const apodo = (actualizado as any).get?.("apodo") ?? null;
      const rol = (actualizado as any).get?.("rol") ?? "user";
      signAndSetCookie(res, { usuario_id, apodo, rol, url_imagen: null });

      return res.status(200).json({ success: true, message: "Foto eliminada correctamente", url_imagen: null });
    } catch (error: any) {
      const status = error?.status || 500;
      const message = status === 401 ? error.message : "Error al eliminar la foto de perfil.";
      return res.status(status).json({ success: false, message });
    }
  }

  static async eliminarCuenta(req: Request, res: Response) {
    try {
      const { usuario_id } = getUserFromRequest(req);
      const eliminado = await UsuarioDAO.remove(usuario_id);
      if (!eliminado) {
        return res.status(404).json({ success: false, message: "No se pudo eliminar el usuario o no existe" });
      }
      res.clearCookie("token");
      return res.status(200).json({ success: true, message: "Cuenta eliminada correctamente" });
    } catch (error: any) {
      const status = error?.status || 500;
      const message = status === 401 ? error.message : "Error al eliminar la cuenta";
      return res.status(status).json({ success: false, message });
    }
  }
}

export default PerfilController;
