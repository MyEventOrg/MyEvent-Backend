import { Router } from "express";
import PerfilController from "../controllers/perfil";

const router = Router();

router.get("/perfil", PerfilController.getMiPerfil);
router.put("/perfil", PerfilController.updateMiPerfil);
router.post("/perfil/foto", PerfilController.updateImagenPerfil);
router.delete("/perfil/foto", PerfilController.eliminarFotoPerfil);
router.delete("/eliminar-cuenta", PerfilController.eliminarCuenta);

export default router;
