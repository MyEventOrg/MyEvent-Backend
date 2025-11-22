import { Router } from "express";
import InvitacionController from "../controllers/invitacion";
import UsuarioController from "../controllers/usuario";


const router = Router();

router.post("/asistenciaEvento", InvitacionController.asistenciaEvento);

router.post("/anularAsistencia", InvitacionController.anularAsistenciaEvento);


// JUAN-MODIFICACION: Nuevas rutas para sistema de invitaciones (HU40 y HU41)
router.post("/invitaciones/enviar", InvitacionController.enviarInvitaciones);
router.put("/invitaciones/:id/responder", InvitacionController.responderInvitacion);
router.get("/invitaciones/pendientes/:usuario_id", InvitacionController.obtenerInvitacionesPendientes);
router.get("/invitaciones/sugeridos/:organizador_id", InvitacionController.obtenerSugeridos);
router.get("/evento/:id/asistentes", InvitacionController.obtenerAsistentesEvento);
router.get("/invitaciones/:evento_id/:usuario_id", InvitacionController.obtenerInvitacionPendiente);


router.get("/usuarios/buscarPorCorreo/:correo", UsuarioController.buscarPorCorreo);

export default router;
