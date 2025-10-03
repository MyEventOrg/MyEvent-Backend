import { Request, Response } from "express";
import CategoriaDAO from "../DAO/categoria";

class CategoriaController {
    static async getCategorias(req: Request, res: Response) {
        try {
            const categorias = await CategoriaDAO.findAll();
            
            if (!categorias) {
                return res.json({ success: true, data: [] });
            }
            
            // Convertir a formato plano 
            const categoriasData = categorias.map((categoria: any) => ({
                categoria_id: categoria.categoria_id || categoria.get('categoria_id'),
                nombre: categoria.nombre || categoria.get('nombre')
            }));
            
            return res.json({ success: true, data: categoriasData });
        } catch (error: any) {
            console.error("Error al obtener categorías:", error);
            return res.status(500).json({ 
                success: false, 
                message: "Error interno del servidor" 
            });
        }
    }
}

export default CategoriaController;