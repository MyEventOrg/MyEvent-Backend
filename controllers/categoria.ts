import { Request, Response } from "express";
import { 
    ControllerFacade, 
    ResponseType, 
    ArrayAdapter, 
    DAOToResponseAdapter 
} from "./base/ControllerInfrastructure";
import { 
    GetCategoriasCommand, 
    CategoriaAdapter, 
    LoggingCommandDecorator, 
    CacheCommandDecorator 
} from "./base/Commands";

class CategoriaController {
    /*
     Obtener todas las categorías 
     */
    static async getCategorias(req: Request, res: Response): Promise<Response> {
        //comando base
        const baseCommand = new GetCategoriasCommand(req, res);
        
        // decorator 
        const decoratedCommand = new LoggingCommandDecorator(
            new CacheCommandDecorator(baseCommand, 'categorias_all')
        );

        //adapter 
        const arrayAdapter = new ArrayAdapter(
            new DAOToResponseAdapter(CategoriaAdapter.adapt)
        );

        //facade
        return await ControllerFacade.handleOperation(req, res, {
            command: decoratedCommand,
            adapter: arrayAdapter,
            successMessage: 'Categorías obtenidas exitosamente'
        });
    }

    /*
    factory para respuestas rapidas
     */
    static async getCategoriasSimple(req: Request, res: Response): Promise<Response> {
        try {
            const command = new GetCategoriasCommand(req, res);
            const categorias = await command.execute();
            
            const adaptedData = categorias.map(CategoriaAdapter.adapt);
            
            return ControllerFacade.sendResponse(
                res, 
                ResponseType.SUCCESS, 
                adaptedData, 
                'Categorías obtenidas'
            );
        } catch (error) {
            return ControllerFacade.sendResponse(
                res, 
                ResponseType.ERROR, 
                null, 
                'Error al obtener categorías'
            );
        }
    }
}

export default CategoriaController;