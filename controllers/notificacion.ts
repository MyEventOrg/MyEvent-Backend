import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import { transporter, MAIL } from "../configs/mailer";
import {
    ControllerFacade,
    ResponseType,
    ValidationContext,
    RequiredFieldsValidation,
    EmailValidation
} from "./base/ControllerInfrastructure";
import { SendVerificationCodeCommand, LoggingCommandDecorator } from "./base/Commands";

//códigos de verificación
const verificationStore = new Map<string, { code: string; expiresAt: number }>();
const CODE_TTL_MS = 10 * 60 * 1000;
const MINUTES = CODE_TTL_MS / 60000;

//cargar template
const TEMPLATE_PATH = path.join(process.cwd(), "templates", "codigoverificacion.html");
let TEMPLATE_HTML: string;

try {
    TEMPLATE_HTML = fs.readFileSync(TEMPLATE_PATH, "utf8");
} catch (e) {
    throw new Error(`[EmailTemplate] No se pudo leer ${TEMPLATE_PATH}. Asegura que exista en runtime.`);
}


// TEMPLATE METHOD para generar códigos
abstract class CodeGenerator {
    abstract generateCode(): string;
    abstract getLength(): number;
}

class SixDigitCodeGenerator extends CodeGenerator {
    generateCode(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    getLength(): number {
        return 6;
    }
}


class SendEmailVerificationCommand extends SendVerificationCodeCommand {
    constructor(req: Request, res: Response, email: string, private codeGenerator: CodeGenerator) {
        super(req, res, email);
    }

    async execute(): Promise<any> {
        const UsuarioDAO = require("../DAO/usuario").default;

        try {
            const existe = await UsuarioDAO.findByEmail(this.email);
            if (existe) {
                return ControllerFacade.sendResponse(
                    this.res,
                    ResponseType.VALIDATION_ERROR,
                    null,
                    "El correo electrónico ya está registrado"
                );
            }

            const code = this.codeGenerator.generateCode();

            verificationStore.set(this.email.toLowerCase(), {
                code,
                expiresAt: Date.now() + CODE_TTL_MS,
            });

            const html = TEMPLATE_HTML
                .replace(/{{CODE}}/g, code)
                .replace(/{{EMAIL}}/g, this.email)
                .replace(/{{MINUTES}}/g, String(MINUTES))
                .replace(/{{YEAR}}/g, String(new Date().getFullYear()));

            await transporter.sendMail({
                from: MAIL.FROM,
                to: this.email,
                subject: "Tu código de verificación - MyEvent",
                html,
            });

            return { success: true, message: "Código enviado" };

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al enviar el código de verificación";
            return ControllerFacade.sendResponse(
                this.res,
                ResponseType.ERROR,
                null,
                message
            );
        }
    }
}


class VerifyEmailCommand extends SendVerificationCodeCommand {
    constructor(req: Request, res: Response, email: string, private code: string) {
        super(req, res, email);
    }

    async execute(): Promise<any> {
        const rec = verificationStore.get(this.email.toLowerCase());
        const now = Date.now();

        if (!rec || now > rec.expiresAt || rec.code !== this.code) {
            throw new Error("Código inválido o expirado");
        }

        verificationStore.delete(this.email.toLowerCase());

        return { success: true, message: "Código verificado" };
    }
}

class NotificationController {
    private static codeGenerator = new SixDigitCodeGenerator();

    static async enviarCodigoVerificacion(req: Request, res: Response): Promise<Response> {
        const { email } = req.body;

        const validation = new ValidationContext()
            .addStrategy(new RequiredFieldsValidation(['email']))
            .addStrategy(new EmailValidation());

        try {
            const command = new LoggingCommandDecorator(
                new SendEmailVerificationCommand(req, res, email, NotificationController.codeGenerator)
            );

            return await ControllerFacade.handleOperation(req, res, {
                validation,
                command,
                successMessage: "Código de verificación enviado exitosamente"
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al enviar el código de verificación";
            return ControllerFacade.sendResponse(
                res,
                ResponseType.ERROR,
                null,
                message
            );
        }
    }

    static async verificarEmail(req: Request, res: Response): Promise<Response> {
        const { email, code } = req.body;

        const validation = new ValidationContext()
            .addStrategy(new RequiredFieldsValidation(['email', 'code']))
            .addStrategy(new EmailValidation());

        try {
            const command = new LoggingCommandDecorator(
                new VerifyEmailCommand(req, res, email, code)
            );

            return await ControllerFacade.handleOperation(req, res, {
                validation,
                command,
                successMessage: "Email verificado exitosamente"
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error al verificar el código de email";
            return ControllerFacade.sendResponse(
                res,
                ResponseType.ERROR,
                null,
                message
            );
        }
    }
}

export default NotificationController;
