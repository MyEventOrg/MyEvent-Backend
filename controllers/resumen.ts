import { Request, Response } from "express";
import { ControllerFacade, ResponseType, BaseCommand,IterableCollection } from "./base/ControllerInfrastructure";
import { LoggingCommandDecorator } from "./base/Commands";


// AGGREGATE PATTERN para datos de resumen

interface ResumenData {
    usuario_id: number;
    totals: {
        creados: number;
        asistiendo: number;
        guardados: number;
    };
    data: {
        eventosCreados: any[];
        eventosAsistiendo: any[];
        eventosGuardados: any[];
    };
}

class ResumenAggregate {
    private eventosCreados: any[] = [];
    private eventosAsistiendo: any[] = [];
    private eventosGuardados: any[] = [];

    constructor(private usuario_id: number) {}

    setEventosCreados(eventos: any[]): ResumenAggregate {
        this.eventosCreados = eventos;
        return this;
    }

    setEventosAsistiendo(eventos: any[]): ResumenAggregate {
        this.eventosAsistiendo = eventos;
        return this;
    }

    setEventosGuardados(eventos: any[]): ResumenAggregate {
        this.eventosGuardados = eventos;
        return this;
    }

    /*
     genera el resumen con iterator
     */
    generateResumen(): ResumenData {
        //usar Iterator para cada coleccion
        const creadosCollection = new IterableCollection(this.eventosCreados);
        const asistiendoCollection = new IterableCollection(this.eventosAsistiendo);
        const guardadosCollection = new IterableCollection(this.eventosGuardados);

        //aplicar transformaciones usando iterator
        const eventosCreados = creadosCollection.map(evento => this.adaptarEvento(evento));
        const eventosAsistiendo = asistiendoCollection.map(evento => this.adaptarEvento(evento));
        const eventosGuardados = guardadosCollection.map(evento => this.adaptarEvento(evento));

        return {
            usuario_id: this.usuario_id,
            totals: {
                creados: eventosCreados.length,
                asistiendo: eventosAsistiendo.length,
                guardados: eventosGuardados.length,
            },
            data: { eventosCreados, eventosAsistiendo, eventosGuardados }
        };
    }

    private adaptarEvento(evento: any) {
        //adapter para formato consistente de eventos
        return {
            evento_id: evento.evento_id,
            titulo: evento.titulo,
            descripcion_corta: evento.descripcion_corta,
            fecha_evento: evento.fecha_evento,
            hora: evento.hora,
            tipo_evento: evento.tipo_evento,
            ubicacion: evento.ubicacion,
            ciudad: evento.ciudad,
            distrito: evento.distrito,
            url_imagen: evento.url_imagen
        };
    }
}


// COMANDOS
class GetUserResumenCommand extends BaseCommand {
    constructor(req: Request, res: Response, private usuario_id: number) {
        super(req, res);
    }

    async execute(): Promise<ResumenData> {
        //importaciones dinamicas
        const ParticipacionDAO = require("../DAO/participacion").default;
        const EventosGuardadoDAO = require("../DAO/eventosGuardado").default;
        const EventoDAO = require("../DAO/evento").default;

        // obtener datos
        const [pCreados, pAsistiendo, guardados] = await Promise.all([
            ParticipacionDAO.findByUsuarioIdAndRoles(this.usuario_id, "organizador"),
            ParticipacionDAO.findByUsuarioIdAndRoles(this.usuario_id, ["asistente", "coorganizador"]),
            EventosGuardadoDAO.findByUsuarioId(this.usuario_id),
        ]);

        // función para IDs unicos
        const uniq = (arr: number[]) => Array.from(new Set(arr));

        const creadosIds = uniq(pCreados.map((p: any) => Number(p.evento_id)));
        const asistiendoIds = uniq(pAsistiendo.map((p: any) => Number(p.evento_id)));
        const guardadosIds = uniq(guardados.map((g: any) => Number(g.evento_id)));

        //obtener eventos activos
        const [eventosCreados, eventosAsistiendo, eventosGuardados] = await Promise.all([
            EventoDAO.findByIdsActivos(creadosIds),
            EventoDAO.findByIdsActivos(asistiendoIds),
            EventoDAO.findByIdsActivos(guardadosIds),
        ]);

        // aggregate pattern para construir resumen
        const resumenAggregate = new ResumenAggregate(this.usuario_id)
            .setEventosCreados(eventosCreados)
            .setEventosAsistiendo(eventosAsistiendo)
            .setEventosGuardados(eventosGuardados);

        return resumenAggregate.generateResumen();
    }
}

class ResumenController {
    /*
     resumen completo de eventos del usuario
     */
    static async getMisEventosMisEventosAsistidosMisEventosGUardados(req: Request, res: Response): Promise<Response> {
        //validar usuario_id
        const usuarioRaw = (req.params.usuarioId ?? req.params.id ?? req.query.usuarioId ?? req.body.usuario_id) as any;
        const usuario_id = Number(usuarioRaw);
        
        if (!usuario_id || Number.isNaN(usuario_id)) {
            return ControllerFacade.sendResponse(
                res, 
                ResponseType.VALIDATION_ERROR, 
                null, 
                "usuario_id requerido y numérico"
            );
        }

        //comando con decorador de logging
        const command = new LoggingCommandDecorator(
            new GetUserResumenCommand(req, res, usuario_id)
        );

        return await ControllerFacade.handleOperation(req, res, {
            command,
            successMessage: "Resumen de eventos obtenido exitosamente"
        });
    }
}

export default ResumenController;
