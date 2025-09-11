import { Request, Response } from "express";
import ClienteDAO from "../DAO/cliente";

class ClienteController {
  static async getClienteById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const cliente = await ClienteDAO.findOne(Number(id));

      if (!cliente) {
        return res.status(404).json({
          success: false,
          message: `No se encontró cliente con id ${id}`,
        });
      }

      return res.status(200).json({
        success: true,
        data: cliente,
      });
    } catch (error) {
      console.error("Error en getClienteById:", error);
      return res.status(500).json({
        success: false,
        message: "Error al obtener el cliente",
      });
    }
  }
}

export default ClienteController;
