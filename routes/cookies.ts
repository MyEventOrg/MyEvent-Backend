import { Router } from "express";
import CookiesController from "../controllers/cookiesCheck";


const router = Router();

router.get("/check-status", CookiesController.checkStatus);

export default router;
