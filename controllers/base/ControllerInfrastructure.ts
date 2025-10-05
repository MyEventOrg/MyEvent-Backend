/*
base para controladores
 */

import { Request, Response } from "express";


//FACTORY METHOD  para respuestas HTTP

export enum ResponseType {
    SUCCESS = 'success',
    ERROR = 'error',
    NOT_FOUND = 'not_found',
    VALIDATION_ERROR = 'validation_error',
    UNAUTHORIZED = 'unauthorized'
}

export interface ApiResponse {
    success: boolean;
    message?: string;
    data?: any;
    error?: string;
}

// Factory abstracto
abstract class ResponseFactory {
    abstract createResponse(data?: any, message?: string): ApiResponse;
    abstract getStatusCode(): number;
}

// Implementaciones concretas
class SuccessResponseFactory extends ResponseFactory {
    createResponse(data?: any, message?: string): ApiResponse {
        return {
            success: true,
            data,
            message: message || 'Operación exitosa'
        };
    }
    
    getStatusCode(): number {
        return 200;
    }
}

class ErrorResponseFactory extends ResponseFactory {
    createResponse(data?: any, message?: string): ApiResponse {
        return {
            success: false,
            error: message || 'Error interno del servidor'
        };
    }
    
    getStatusCode(): number {
        return 500;
    }
}

class NotFoundResponseFactory extends ResponseFactory {
    createResponse(data?: any, message?: string): ApiResponse {
        return {
            success: false,
            message: message || 'Recurso no encontrado'
        };
    }
    
    getStatusCode(): number {
        return 404;
    }
}

class ValidationErrorResponseFactory extends ResponseFactory {
    createResponse(data?: any, message?: string): ApiResponse {
        return {
            success: false,
            message: message || 'Error de validación',
            data
        };
    }
    
    getStatusCode(): number {
        return 400;
    }
}

class UnauthorizedResponseFactory extends ResponseFactory {
    createResponse(data?: any, message?: string): ApiResponse {
        return {
            success: false,
            message: message || 'No autorizado'
        };
    }
    
    getStatusCode(): number {
        return 401;
    }
}

// Factory principal
export class HttpResponseFactory {
    private static factories = new Map<ResponseType, ResponseFactory>([
        [ResponseType.SUCCESS, new SuccessResponseFactory()],
        [ResponseType.ERROR, new ErrorResponseFactory()],
        [ResponseType.NOT_FOUND, new NotFoundResponseFactory()],
        [ResponseType.VALIDATION_ERROR, new ValidationErrorResponseFactory()],
        [ResponseType.UNAUTHORIZED, new UnauthorizedResponseFactory()]
    ]);

    static createResponse(type: ResponseType, data?: any, message?: string): { response: ApiResponse; statusCode: number } {
        const factory = this.factories.get(type);
        if (!factory) {
            throw new Error(`Factory no encontrado para tipo: ${type}`);
        }

        return {
            response: factory.createResponse(data, message),
            statusCode: factory.getStatusCode()
        };
    }
}


//STRATEGY PATTERN para validaciones

export interface ValidationStrategy {
    validate(data: any): ValidationResult;
}

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

export class RequiredFieldsValidation implements ValidationStrategy {
    constructor(private requiredFields: string[]) {}

    validate(data: any): ValidationResult {
        const errors: string[] = [];
        
        for (const field of this.requiredFields) {
            if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
                errors.push(`El campo ${field} es requerido`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export class EmailValidation implements ValidationStrategy {
    validate(data: any): ValidationResult {
        const errors: string[] = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        
        if (data.email && !emailRegex.test(data.email)) {
            errors.push('El formato del email no es válido');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export class ValidationContext {
    private strategies: ValidationStrategy[] = [];

    addStrategy(strategy: ValidationStrategy): ValidationContext {
        this.strategies.push(strategy);
        return this;
    }

    validateAll(data: any): ValidationResult {
        const allErrors: string[] = [];

        for (const strategy of this.strategies) {
            const result = strategy.validate(data);
            if (!result.isValid) {
                allErrors.push(...result.errors);
            }
        }

        return {
            isValid: allErrors.length === 0,
            errors: allErrors
        };
    }
}


//COMMAND PATTERN  para acciones de controlador

export interface Command {
    execute(): Promise<any>;
}

export abstract class BaseCommand implements Command {
    constructor(protected req: Request, protected res: Response) {}
    
    abstract execute(): Promise<any>;
}

// Invoker
export class CommandInvoker {
    private commands: Command[] = [];

    addCommand(command: Command): void {
        this.commands.push(command);
    }

    async executeAll(): Promise<any[]> {
        const results = [];
        for (const command of this.commands) {
            results.push(await command.execute());
        }
        return results;
    }

    async executeLatest(): Promise<any> {
        if (this.commands.length === 0) {
            throw new Error('No hay comandos para ejecutar');
        }
        
        const latestCommand = this.commands[this.commands.length - 1];
        return await latestCommand.execute();
    }
}


// 4. ADAPTER PATTERN - Para conversión de datos

export interface DataAdapter<TSource, TTarget> {
    adapt(source: TSource): TTarget;
}

// Adaptador para DAOs
export class DAOToResponseAdapter<TDao, TResponse> implements DataAdapter<TDao, TResponse> {
    constructor(private mappingFunction: (dao: TDao) => TResponse) {}

    adapt(source: TDao): TResponse {
        return this.mappingFunction(source);
    }
}

// Adaptador para arrays
export class ArrayAdapter<TSource, TTarget> implements DataAdapter<TSource[], TTarget[]> {
    constructor(private itemAdapter: DataAdapter<TSource, TTarget>) {}

    adapt(source: TSource[]): TTarget[] {
        return source.map(item => this.itemAdapter.adapt(item));
    }
}


//FACADE PATTERN simplificador operaciones 

export class ControllerFacade {
    /*
     validación, ejecución y respuesta
     */
    static async handleOperation(
        req: Request,
        res: Response,
        operation: {
            validation?: ValidationContext;
            command: Command;
            successMessage?: string;
            adapter?: DataAdapter<any, any>;
        }
    ): Promise<Response> {
        try {
            //Validación usando Strategy
            if (operation.validation) {
                const validationResult = operation.validation.validateAll(req.body);
                if (!validationResult.isValid) {
                    const { response, statusCode } = HttpResponseFactory.createResponse(
                        ResponseType.VALIDATION_ERROR,
                        validationResult.errors,
                        'Errores de validación'
                    );
                    return res.status(statusCode).json(response);
                }
            }

            //ejecutar
            const result = await operation.command.execute();

            //adaptar datos si es necesario
            const adaptedResult = operation.adapter ? operation.adapter.adapt(result) : result;

            //respuesta usando Factory
            const { response, statusCode } = HttpResponseFactory.createResponse(
                ResponseType.SUCCESS,
                adaptedResult,
                operation.successMessage
            );
            
            return res.status(statusCode).json(response);

        } catch (error) {
            console.error('Error en operación:', error);
            
            const { response, statusCode } = HttpResponseFactory.createResponse(
                ResponseType.ERROR,
                null,
                error instanceof Error ? error.message : 'Error interno del servidor'
            );
            
            return res.status(statusCode).json(response);
        }
    }

    /*
     respuestas simples con Factory
     */
    static sendResponse(
        res: Response,
        type: ResponseType,
        data?: any,
        message?: string
    ): Response {
        const { response, statusCode } = HttpResponseFactory.createResponse(type, data, message);
        return res.status(statusCode).json(response);
    }
}


//ITERATOR PATTERN iterar sobre colecciones

export interface Iterator<T> {
    hasNext(): boolean;
    next(): T;
    reset(): void;
}

export class ArrayIterator<T> implements Iterator<T> {
    private currentIndex = 0;

    constructor(private items: T[]) {}

    hasNext(): boolean {
        return this.currentIndex < this.items.length;
    }

    next(): T {
        if (!this.hasNext()) {
            throw new Error('No hay más elementos');
        }
        return this.items[this.currentIndex++];
    }

    reset(): void {
        this.currentIndex = 0;
    }
}

export class IterableCollection<T> {
    constructor(private items: T[]) {}

    getIterator(): Iterator<T> {
        return new ArrayIterator(this.items);
    }

    forEach(callback: (item: T, index: number) => void): void {
        const iterator = this.getIterator();
        let index = 0;
        
        while (iterator.hasNext()) {
            callback(iterator.next(), index++);
        }
    }

    map<U>(transform: (item: T) => U): U[] {
        const result: U[] = [];
        const iterator = this.getIterator();
        
        while (iterator.hasNext()) {
            result.push(transform(iterator.next()));
        }
        
        return result;
    }
}