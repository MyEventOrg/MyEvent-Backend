/*
  Comandos para el controlador de categorias
  Command Pattern
 */
import { Request, Response } from "express";
import CategoriaDAO from "../../DAO/categoria";
import UsuarioDAO from "../../DAO/usuario";
import { BaseCommand } from "./ControllerInfrastructure";


//COMANDOS ESPECIFICOS
export class GetCategoriasCommand extends BaseCommand {
    async execute(): Promise<any> {
        const categorias = await CategoriaDAO.findAll();
        return categorias || [];
    }
}


//ADAPTADORES ESPECIFICOS  

export interface CategoriaResponse {
    categoria_id: number;
    nombre: string;
}

export class CategoriaAdapter {
    static adapt(categoria: any): CategoriaResponse {
        return {
            categoria_id: categoria.categoria_id || categoria.get('categoria_id'),
            nombre: categoria.nombre || categoria.get('nombre')
        };
    }
}


// COMANDOS PARA OTROS CONTROLADORES

export class GetUserByIdCommand extends BaseCommand {
    constructor(req: Request, res: Response, private userId: number) {
        super(req, res);
    }

    async execute(): Promise<any> {
        return await UsuarioDAO.findOne(this.userId);
    }
}

export class LoginCommand extends BaseCommand {
    constructor(req: Request, res: Response, private email: string, private password: string) {
        super(req, res);
    }

    async execute(): Promise<any> {
        const usuario = await UsuarioDAO.findByEmail(this.email);

        if (!usuario || usuario.contrasena !== this.password) {
            throw new Error("Usuario o contraseña errónea");
        }

        return {
            usuario_id: usuario.usuario_id,
            apodo: usuario.apodo,
            rol: usuario.rol,
            email: usuario.correo
        };
    }
}

export class SendVerificationCodeCommand extends BaseCommand {
    constructor(req: Request, res: Response, protected email: string) {
        super(req, res);
    }

    async execute(): Promise<any> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();       
        return { code, sent: true };
    }
}


// DECORADOR PATTERN añade funcionalidad a comandos

export abstract class CommandDecorator implements Command {
    constructor(protected command: Command) {}

    abstract execute(): Promise<any>;
}

export class LoggingCommandDecorator extends CommandDecorator {
    async execute(): Promise<any> {
        try {
            const result = await this.command.execute();
            return result;
        } catch (error) {
            console.error(`Error en comando ${this.command.constructor.name}:`, error);
            throw error;
        }
    }
}

export class CacheCommandDecorator extends CommandDecorator {
    private static cache = new Map<string, { data: any; timestamp: number }>();
    private readonly ttl = 5 * 60 * 1000; // 5 minutos

    constructor(command: Command, private cacheKey: string) {
        super(command);
    }

    async execute(): Promise<any> {
        const cached = CacheCommandDecorator.cache.get(this.cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.ttl) {
            console.log(`Cache hit para: ${this.cacheKey}`);
            return cached.data;
        }

        const result = await this.command.execute();
        
        CacheCommandDecorator.cache.set(this.cacheKey, {
            data: result,
            timestamp: Date.now()
        });

        console.log(`Cache actualizado para: ${this.cacheKey}`);
        return result;
    }
}

interface Command {
    execute(): Promise<any>;
}