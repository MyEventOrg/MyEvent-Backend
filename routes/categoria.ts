import { Router } from "express";
import CategoriaController from "../controllers/categoria";

const router = Router();

router.get("/categorias", CategoriaController.getCategorias);

export default router;