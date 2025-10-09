import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {
    ControllerFacade,
    ResponseType,
    ValidationContext,
    RequiredFieldsValidation,
    EmailValidation,
    DAOToResponseAdapter
} from "./base/ControllerInfrastructure";
import {
    GetUserByIdCommand,
    LoginCommand,
    LoggingCommandDecorator
} from "./base/Commands";
import UsuarioDAO from "../DAO/usuario";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";


interface AuthenticationStrategy {
    authenticate(credentials: any): Promise<any>;
    generateToken(user: any): string;
}

class JWTAuthenticationStrategy implements AuthenticationStrategy {
    async authenticate(credentials: { email: string; password: string }): Promise<any> {
        const user = await UsuarioDAO.findByEmail(credentials.email);
        if (!user) throw new Error("Usuario no encontrado");

        const isMatch = await bcrypt.compare(credentials.password, user.contrasena);
        if (!isMatch) throw new Error("Contraseña incorrecta");

        return user;
    }

    generateToken(user: any): string {
        const payload = {
            usuario_id: user.usuario_id,
            apodo: user.apodo,
            rol: user.rol,
        };
        return jwt.sign(payload, JWT_SECRET);
    }
}

class AuthenticationContext {
    constructor(private strategy: AuthenticationStrategy) { }

    async login(credentials: any): Promise<{ user: any; token: string }> {
        const user = await this.strategy.authenticate(credentials);
        const token = this.strategy.generateToken(user);
        return { user, token };
    }
}



class UserAdapter {
    static adapt(user: any) {
        return {
            usuario_id: user.usuario_id,
            apodo: user.apodo,
            email: user.correo,
            rol: user.rol,
            activo: user.activo,
        };
    }
}


class LogoutCommand extends LoginCommand {
    async execute(): Promise<any> {
        return { success: true, message: "Sesión cerrada exitosamente" };
    }
}

class UsuarioController {
    private static authContext = new AuthenticationContext(new JWTAuthenticationStrategy());

    static async getusuarioById(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return ControllerFacade.sendResponse(
                res,
                ResponseType.VALIDATION_ERROR,
                null,
                "ID de usuario inválido"
            );
        }

        const command = new LoggingCommandDecorator(
            new GetUserByIdCommand(req, res, Number(id))
        );

        const adapter = new DAOToResponseAdapter(UserAdapter.adapt);

        return await ControllerFacade.handleOperation(req, res, {
            command,
            adapter,
            successMessage: "Usuario obtenido exitosamente"
        });
    }

    static async iniciarSesion(req: Request, res: Response): Promise<Response> {
        const validation = new ValidationContext()
            .addStrategy(new RequiredFieldsValidation(['email', 'password']))
            .addStrategy(new EmailValidation());

        try {
            const validationResult = validation.validateAll(req.body);
            if (!validationResult.isValid) {
                return ControllerFacade.sendResponse(
                    res,
                    ResponseType.VALIDATION_ERROR,
                    validationResult.errors,
                    "Errores de validación"
                );
            }

            const { user, token } = await UsuarioController.authContext.login(req.body);

            res.cookie("token", token, {
                httpOnly: false,
                secure: false,
                sameSite: "lax",
                path: "/",
            });

            return ControllerFacade.sendResponse(
                res,
                ResponseType.SUCCESS,
                { token, user: UserAdapter.adapt(user) },
                "Inicio de sesión exitoso"
            );

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error en el servidor al iniciar sesión";
            return ControllerFacade.sendResponse(
                res,
                ResponseType.UNAUTHORIZED,
                null,
                message
            );
        }
    }

    static async cerrarSesion(req: Request, res: Response): Promise<Response> {
        const command = new LogoutCommand(req, res, '', '');

        res.clearCookie("token", {
            httpOnly: false,
            secure: false,
            sameSite: "lax",
            path: "/",
        });

        return await ControllerFacade.handleOperation(req, res, {
            command,
            successMessage: "Sesión cerrada exitosamente"
        });
    }

    static async crearUsuario(req: Request, res: Response): Promise<Response> {
        const validation = new ValidationContext()
            .addStrategy(new RequiredFieldsValidation(['nombres', 'apellidos', 'apodo', 'email', 'password']))
            .addStrategy(new EmailValidation());

        try {
            const validationResult = validation.validateAll(req.body);
            if (!validationResult.isValid) {
                return ControllerFacade.sendResponse(
                    res,
                    ResponseType.VALIDATION_ERROR,
                    validationResult.errors,
                    "Errores de validación"
                );
            }

            const { nombres, apellidos, apodo, email, password } = req.body;

            const passwordRegex =
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_])[A-Za-z\d@$!%*?&.#_]{8,}$/;

            if (!passwordRegex.test(password)) {
                return ControllerFacade.sendResponse(
                    res,
                    ResponseType.VALIDATION_ERROR,
                    null,
                    "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.#_)"
                );
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const nombreCompleto = `${nombres} ${apellidos}`;
            const fecha = new Date();
            const fechaActual = fecha.toLocaleDateString("sv-SE");

            const nuevoUsuario = await UsuarioDAO.create({
                nombreCompleto,
                correo: email,
                contrasena: hashedPassword,
                fecha_registro: fechaActual,
                activo: 1,
                rol: "user",
                apodo,
            });

            return ControllerFacade.sendResponse(
                res,
                ResponseType.SUCCESS,
                nuevoUsuario,
                "Usuario creado exitosamente"
            );

        } catch (error) {
            const message = error instanceof Error ? error.message : "Error en el servidor al crear usuario";
            return ControllerFacade.sendResponse(res, ResponseType.ERROR, null, message);
        }
    }

    static async getUsuarios(req: Request, res: Response): Promise<Response> {
        const command = new class extends LoginCommand {
            async execute(): Promise<any> {
                const page = parseInt(this.req.query.page as string) || 1;
                const limit = 10;
                const search = (this.req.query.search as string) || "";

                return await UsuarioDAO.findPaginatedUsers(page, limit, search);
            }
        }(req, res, '', '');

        return await ControllerFacade.handleOperation(req, res, {
            command,
            successMessage: "Usuarios obtenidos exitosamente"
        });
    }


    static async changeActivation(req: Request, res: Response): Promise<Response> {
        const { id } = req.params;
        const { activo } = req.body;

        if (activo !== 0 && activo !== 1) {
            return ControllerFacade.sendResponse(
                res,
                ResponseType.VALIDATION_ERROR,
                null,
                "El estado activo debe ser 0 o 1"
            );
        }

        const command = new class extends LoginCommand {
            async execute(): Promise<any> {
                return await UsuarioDAO.update(Number(id), { activo });
            }
        }(req, res, '', '');

        return await ControllerFacade.handleOperation(req, res, {
            command,
            successMessage: `Usuario ${id} actualizado correctamente`
        });
    }
}

export default UsuarioController;
