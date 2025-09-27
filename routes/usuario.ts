import { Router } from "express";
import UsuarioController from "../controllers/usuario";


const router = Router();

router.get("/usuario/:id", UsuarioController.getusuarioById);

router.post("/login", UsuarioController.iniciarSesion);

router.post("/logout", UsuarioController.cerrarSesion);

export default router;
