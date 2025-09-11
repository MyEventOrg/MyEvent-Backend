import { Router } from "express";
import ClienteController from "../controllers/cliente";

const router = Router();

router.get("/clientes/:id", ClienteController.getClienteById);

export default router;
