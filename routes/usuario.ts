import { Router } from "express";
import UsuarioController from "../controllers/usuario";

const router = Router();

router.get("/usuario/:id", UsuarioController.getusuarioById);

export default router;
