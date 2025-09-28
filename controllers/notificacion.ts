
import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { transporter, MAIL } from "../configs/mailer";

const verificationStore = new Map<string, { code: string; expiresAt: number }>();
const CODE_TTL_MS = 10 * 60 * 1000;
const MINUTES = CODE_TTL_MS / 60000;


const TEMPLATE_PATH = path.join(process.cwd(), "templates", "codigoverificacion.html");


let TEMPLATE_HTML: string;
try {
    TEMPLATE_HTML = fs.readFileSync(TEMPLATE_PATH, "utf8");
} catch (e) {
    throw new Error(`[EmailTemplate] No se pudo leer ${TEMPLATE_PATH}. Asegura que exista en runtime.`);
}

function generate6DigitCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

class NotificationController {
    static async enviarCodigoVerificacion(req: Request, res: Response) {
        try {
            const { email } = req.body as { email: string };
            const code = generate6DigitCode();
            verificationStore.set(email.toLowerCase(), {
                code,
                expiresAt: Date.now() + CODE_TTL_MS,
            });

            const html = TEMPLATE_HTML
                .replace(/{{CODE}}/g, code)
                .replace(/{{EMAIL}}/g, email)
                .replace(/{{MINUTES}}/g, String(MINUTES))
                .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

            await transporter.sendMail({
                from: MAIL.FROM,
                to: email,
                subject: "Tu código de verificación - MyEvent",
                html,
            });

            return res.status(200).json({ success: true, message: "Código enviado" });
        } catch (error) {
            console.error("enviarCodigoVerificacion error:", error);
            return res.status(500).json({ success: false, message: "No se pudo enviar el código" });
        }
    }

    static async verificarEmail(req: Request, res: Response) {
        try {
            const { email, code } = req.body as { email: string; code: string };

            const rec = verificationStore.get(email.toLowerCase());
            const now = Date.now();

            if (!rec || now > rec.expiresAt || rec.code !== code) {
                return res.status(200).json({ success: false, message: "Código inválido o expirado" });
            }

            verificationStore.delete(email.toLowerCase());
            return res.status(200).json({ success: true, message: "Código verificado" });
        } catch (error) {
            console.error("verificarEmail error:", error);
            return res.status(500).json({ success: false, message: "Error del servidor" });
        }
    }
}

export default NotificationController;
