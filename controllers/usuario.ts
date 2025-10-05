import { Request, Response } from "express";
import jwt from "jsonwebtoken";
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


// BRIDGE PATTERN
interface AuthenticationStrategy {
    authenticate(credentials: any): Promise<any>;
    generateToken(user: any): string;
}

class JWTAuthenticationStrategy implements AuthenticationStrategy {
    async authenticate(credentials: { email: string; password: string }): Promise<any> {
        const command = new LoginCommand(null as any, null as any, credentials.email, credentials.password);
        return await command.execute();
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

// contexto que usa bridge
class AuthenticationContext {
    constructor(private strategy: AuthenticationStrategy) {}

    async login(credentials: any): Promise<{ user: any; token: string }> {
        const user = await this.strategy.authenticate(credentials);
        const token = this.strategy.generateToken(user);
        return { user, token };
    }
}


//ADAPTADORES ESPECIFICOS

class UserAdapter {
    static adapt(user: any) {
        return {
            usuario_id: user.usuario_id,
            apodo: user.apodo,
            email: user.email,
            rol: user.rol,
        };
    }
}


// COMANDOS ESPECIFICOS
class LogoutCommand extends LoginCommand {
    async execute(): Promise<any> {
        return { success: true, message: "Sesión cerrada exitosamente" };
    }
}

class UsuarioController {
    private static authContext = new AuthenticationContext(new JWTAuthenticationStrategy());

    /*
     Obtiene usuario por ID usando Command + Adapter + Facade patterns
     */
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

    /*
     inicio de sesión
     */
    static async iniciarSesion(req: Request, res: Response): Promise<Response> {
        //validacion usando Strategy
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

            //autenticación usando bridge
            const { user, token } = await UsuarioController.authContext.login(req.body);

            //configurar cookie
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

    /*
     cierre de sesión usando Command
     */
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

    /*
     crea nuevo usuario strategy y command
     */
    static async crearUsuario(req: Request, res: Response): Promise<Response> {
        const validation = new ValidationContext()
            .addStrategy(new RequiredFieldsValidation(['nombres', 'apellidos', 'apodo', 'email', 'password']))
            .addStrategy(new EmailValidation());

        return await ControllerFacade.handleOperation(req, res, {
            validation,
            command: new class extends LoginCommand {
                async execute(): Promise<any> {
                    const { nombres, apellidos, apodo, email, password } = this.req.body;
                    
                    const nombreCompleto = `${nombres} ${apellidos}`;
                    const fecha = new Date();
                    const fechaActual = fecha.toLocaleDateString("sv-SE");

                    return await UsuarioDAO.create({
                        nombreCompleto,
                        correo: email,
                        contrasena: password,
                        fecha_registro: fechaActual,
                        activo: 1,
                        rol: "user",
                        apodo,
                    });
                }
            }(req, res, '', ''),
            successMessage: "Usuario creado exitosamente"
        });
    }

    /*
     obtiene usuariosusando command
     */
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

    /*
     cambia el estado de un usuario
     */
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
