import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { transporter, MAIL } from "../configs/mailer";
import UsuarioDAO from "../DAO/usuario";

// Almacén temporal de códigos de verificación
const verificationStore = new Map<string, { code: string; expiresAt: number }>();
const CODE_TTL_MS = 10 * 60 * 1000; // 10 minutos
const MINUTES = CODE_TTL_MS / 60000;

// Cargar template de correo
const TEMPLATE_PATH = path.join(process.cwd(), "templates", "codigoverificacion.html");
let TEMPLATE_HTML: string;

try {
    TEMPLATE_HTML = fs.readFileSync(TEMPLATE_PATH, "utf8");
} catch (e) {
    throw new Error(`[EmailTemplate] No se pudo leer ${TEMPLATE_PATH}. Asegura que exista en runtime.`);
}

class NotificationController {

    // ==========================
    // 1. ENVIAR CÓDIGO
    // ==========================
    static async enviarCodigoVerificacion(req: Request, res: Response): Promise<Response> {
        try {
            const { email } = req.body;

            // Validación manual
            if (!email || typeof email !== "string" || email.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "El email es requerido"
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "El formato del email no es válido"
                });
            }

            // Verificar si el usuario ya existe
            const existe = await UsuarioDAO.findByEmail(email);
            if (existe) {
                return res.status(400).json({
                    success: false,
                    message: "El correo electrónico ya está registrado"
                });
            }

            // Generar código (6 dígitos)
            const code = Math.floor(100000 + Math.random() * 900000).toString();

            // Guardar en memoria con expiración
            verificationStore.set(email.toLowerCase(), {
                code,
                expiresAt: Date.now() + CODE_TTL_MS,
            });

            // Reemplazar variables en el template HTML
            const html = TEMPLATE_HTML
                .replace(/{{CODE}}/g, code)
                .replace(/{{EMAIL}}/g, email)
                .replace(/{{MINUTES}}/g, String(MINUTES))
                .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

            // Enviar correo
            await transporter.sendMail({
                from: MAIL.FROM,
                to: email,
                subject: "Tu código de verificación - MyEvent",
                html,
            });

            return res.status(200).json({
                success: true,
                message: "Código de verificación enviado exitosamente"
            });

        } catch (error: any) {
            console.error("Error al enviar el código de verificación:", error);
            return res.status(500).json({
                success: false,
                message: "Error al enviar el código de verificación"
            });
        }
    }

    // ==========================
    // 2. VERIFICAR CÓDIGO
    // ==========================
    static async verificarEmail(req: Request, res: Response): Promise<Response> {
        try {
            const { email, code } = req.body;

            // Validaciones manuales
            if (!email || typeof email !== "string" || email.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "El email es requerido"
                });
            }

            if (!code || typeof code !== "string" || code.trim() === "") {
                return res.status(400).json({
                    success: false,
                    message: "El código es requerido"
                });
            }

            const rec = verificationStore.get(email.toLowerCase());
            const now = Date.now();

            // Validar existencia, expiración o código incorrecto
            if (!rec || now > rec.expiresAt || rec.code !== code) {
                return res.status(400).json({
                    success: false,
                    message: "Código inválido o expirado"
                });
            }

            // Eliminar el código usado
            verificationStore.delete(email.toLowerCase());

            return res.status(200).json({
                success: true,
                message: "Email verificado exitosamente"
            });

        } catch (error: any) {
            console.error("Error al verificar el código:", error);
            return res.status(500).json({
                success: false,
                message: "Error al verificar el código de email"
            });
        }
    }
}

export default NotificationController;
