import { Request, Response } from "express";
import CategoriaDAO from "../DAO/categoria";

class CategoriaController {

    // Obtener todas las categorías (versión limpia)
    static async getCategorias(req: Request, res: Response): Promise<Response> {
        try {
            const categorias = await CategoriaDAO.findAll() || [];


            // Adaptación manual (antes era con Adapter)
            const data = categorias.map((categoria: any) => ({
                categoria_id: categoria.categoria_id || categoria.get("categoria_id"),
                nombre: categoria.nombre || categoria.get("nombre"),
            }));

            return res.status(200).json({
                success: true,
                message: "Categorías obtenidas exitosamente",
                data,
            });
        } catch (error: any) {
            console.error("Error al obtener categorías:", error);
            return res.status(500).json({
                success: false,
                message: "Error al obtener categorías",
            });
        }
    }

    // Versión simple (puedes dejar una sola versión si quieres)
    static async getCategoriasSimple(req: Request, res: Response): Promise<Response> {
        try {
            const categorias = await CategoriaDAO.findAll() || [];

            const data = categorias.map((categoria: any) => ({
                categoria_id: categoria.categoria_id || categoria.get("categoria_id"),
                nombre: categoria.nombre || categoria.get("nombre"),
            }));

            return res.status(200).json({
                success: true,
                data,
                message: "Categorías obtenidas",
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error al obtener categorías",
            });
        }
    }
}

export default CategoriaController;
