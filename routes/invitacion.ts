import { Router } from "express";
import InvitacionController from "../controllers/invitacion";

const router = Router();

router.post("/asistenciaEvento", InvitacionController.asistenciaEvento);

router.post("/anularAsistencia", InvitacionController.anularAsistenciaEvento);

export default router;
