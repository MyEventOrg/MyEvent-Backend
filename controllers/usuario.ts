import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import UsuarioDAO from "../DAO/usuario";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";

class UsuarioController {

    // ==========================
    // 1. OBTENER USUARIO POR ID
    // ==========================
    static async getusuarioById(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                return res.status(400).json({
                    success: false,
                    message: "ID de usuario inválido"
                });
            }

            const user = await UsuarioDAO.findOne(Number(id));
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: "Usuario no encontrado"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Usuario obtenido exitosamente",
                data: {
                    usuario_id: user.usuario_id,
                    apodo: user.apodo,
                    email: user.correo,
                    rol: user.rol,
                    activo: user.activo
                }
            });

        } catch (error) {
            console.error("Error al obtener usuario por ID:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }

    // ==========================
    // 2. INICIAR SESIÓN
    // ==========================
    static async iniciarSesion(req: Request, res: Response): Promise<Response> {
        try {
            const { email, password } = req.body;

            // Validaciones manuales
            if (!email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Email y contraseña son requeridos"
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Formato de email inválido"
                });
            }

            const user = await UsuarioDAO.findByEmail(email);
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

            if (!user.activo) {
                return res.status(401).json({
                    success: false,
                    message: "El usuario no está activo"
                });
            }

            const isMatch = await bcrypt.compare(password, user.contrasena);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Usuario o contraseña incorrectos"
                });
            }

            const token = jwt.sign(
                {
                    usuario_id: user.usuario_id,
                    apodo: user.apodo,
                    rol: user.rol
                },
                JWT_SECRET
            );

            res.cookie("token", token, {
                httpOnly: false,
                secure: false,
                sameSite: "lax",
                path: "/",
            });

            return res.status(200).json({
                success: true,
                message: "Inicio de sesión exitoso",
                data: {
                    token,
                    user: {
                        usuario_id: user.usuario_id,
                        apodo: user.apodo,
                        email: user.correo,
                        rol: user.rol,
                        activo: user.activo
                    }
                }
            });

        } catch (error) {
            console.error("Error al iniciar sesión:", error);
            return res.status(500).json({
                success: false,
                message: "Error en el servidor al iniciar sesión"
            });
        }
    }

    // ==========================
    // 3. CERRAR SESIÓN
    // ==========================
    static async cerrarSesion(req: Request, res: Response): Promise<Response> {
        try {
            res.clearCookie("token", {
                httpOnly: false,
                secure: false,
                sameSite: "lax",
                path: "/",
            });

            return res.status(200).json({
                success: true,
                message: "Sesión cerrada exitosamente"
            });
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }

    // ==========================
    // 4. CREAR USUARIO
    // ==========================
    static async crearUsuario(req: Request, res: Response): Promise<Response> {
        try {
            const { nombres, apellidos, apodo, email, password } = req.body;

            // Validaciones manuales
            if (!nombres || !apellidos || !apodo || !email || !password) {
                return res.status(400).json({
                    success: false,
                    message: "Todos los campos son requeridos"
                });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    success: false,
                    message: "Formato de email inválido"
                });
            }

            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#_])[A-Za-z\d@$!%*?&.#_]{8,}$/;
            if (!passwordRegex.test(password)) {
                return res.status(400).json({
                    success: false,
                    message: "La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (@$!%*?&.#_)"
                });
            }

            const usuarioExistente = await UsuarioDAO.findByEmail(email);
            if (usuarioExistente) {
                return res.status(400).json({
                    success: false,
                    message: "El email ya está registrado"
                });
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

            return res.status(201).json({
                success: true,
                message: "Usuario creado exitosamente",
                data: nuevoUsuario
            });

        } catch (error) {
            console.error("Error al crear usuario:", error);
            return res.status(500).json({
                success: false,
                message: "Error en el servidor al crear usuario"
            });
        }
    }
    static async getUsuarios(req: Request, res: Response) {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = 10;
            const search = (req.query.search as string) || "";

            const result = await UsuarioDAO.findPaginatedUsers(page, limit, search);

            return res.json({
                data: result.data,
                page: result.page,
                total: result.total,
                totalPages: result.totalPages,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: "Error al obtener usuarios" });
        }
    }

    static async changeActivation(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params;
            const { activo } = req.body;

            if (!id || isNaN(Number(id))) {
                return res.status(400).json({
                    success: false,
                    message: "ID inválido"
                });
            }

            if (activo !== 0 && activo !== 1) {
                return res.status(400).json({
                    success: false,
                    message: "El estado activo debe ser 0 o 1"
                });
            }

            const updated = await UsuarioDAO.update(Number(id), { activo });

            return res.status(200).json({
                success: true,
                message: `Usuario ${id} actualizado correctamente`,
                data: updated
            });

        } catch (error) {
            console.error("Error al actualizar usuario:", error);
            return res.status(500).json({
                success: false,
                message: "Error interno del servidor"
            });
        }
    }
}

export default UsuarioController;
