import { Request, Response } from "express";
import EventosGuardadoDAO from "../DAO/eventosGuardado";

class EventosGuardadoController {
    // Guardar evento para un usuario
    static async guardarEvento(req: Request, res: Response): Promise<Response> {
        try {
            const { usuario_id, evento_id } = req.body;

            // Validación básica
            if (!usuario_id || !evento_id) {
                return res.status(400).json({
                    success: false,
                    message: "usuario_id y evento_id son requeridos",
                });
            }

            // Crear el registro en la tabla de guardados
            const guardado = await EventosGuardadoDAO.create({ usuario_id, evento_id });

            return res.status(201).json({
                success: true,
                message: "Evento guardado exitosamente",
                data: guardado,
            });
        } catch (error) {
            console.error("Error en guardarEvento:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno al guardar evento",
            });
        }
    }
}

export default EventosGuardadoController;
