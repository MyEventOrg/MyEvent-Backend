import { Request, Response } from "express";
import UsuarioDAO from "../DAO/usuario";

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
}

export default UsuarioController;
