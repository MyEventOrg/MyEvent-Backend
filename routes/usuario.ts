import { Router } from "express";
import UsuarioController from "../controllers/usuario";


const router = Router();

router.get("/usuario/:id", UsuarioController.getusuarioById);

router.post("/login", UsuarioController.iniciarSesion);

router.post("/logout", UsuarioController.cerrarSesion);

router.post("/crear-usuario", UsuarioController.crearUsuario);

router.get("/usuarios", UsuarioController.getUsuarios);

router.put("/usuarios/:id/estado", UsuarioController.changeActivation);

export default router;
