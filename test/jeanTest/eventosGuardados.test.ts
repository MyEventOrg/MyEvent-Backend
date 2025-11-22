/**
 * ================================================================
 * 🧪 TEST: guardarEvento → devolverEventosGuardados
 * ================================================================
 *
 * ✔ Caso simulado:
 *   - El usuario 2 ya tiene guardados los eventos 1 y 2.
 *   - Guarda ahora los eventos 7 y 8.
 *   - Se llama devolverEventosGuardados y debe retornar 4 eventos.
 *
 * ✔ Validaciones:
 *   - Status = 200
 *   - success = true
 *   - total = 4
 * ================================================================
 */

import EventosGuardadoController from "../../controllers/eventoGuardado";
import EventosGuardadoDAO from "../../DAO/eventosGuardado";
import EventoDAO from "../../DAO/evento";
import ParticipacionDAO from "../../DAO/participacion";

// 🔵 Mockear DAOs
jest.mock("../../DAO/eventosGuardado");
jest.mock("../../DAO/evento");
jest.mock("../../DAO/participacion");

describe("Flujo: guardarEvento → devolverEventosGuardados", () => {

    it("Debe devolver 4 eventos guardados después de agregar 2 nuevos", async () => {

        // =====================================================
        // Mock inicial: usuario 2 ya tiene eventos 1 y 2
        // =====================================================
        let guardadosMock = [
            { usuario_id: 2, evento_id: 1 },
            { usuario_id: 2, evento_id: 2 }
        ];

        (EventosGuardadoDAO.findByUsuarioId as jest.Mock).mockImplementation(async (usuario_id: number) => {
            return guardadosMock.filter(e => e.usuario_id === usuario_id);
        });

        // =====================================================
        // Mock del create → agregar a la lista en memoria
        // =====================================================
        (EventosGuardadoDAO.create as jest.Mock).mockImplementation(async ({ usuario_id, evento_id }) => {
            const nuevo = { usuario_id, evento_id };
            guardadosMock.push(nuevo);
            return nuevo;
        });

        // =====================================================
        // Mock de los eventos para devolverEventosGuardados
        // =====================================================
        type EventoMock = {
            evento_id: number;
            titulo: string;
            estado_evento: string;
        };

        const eventosMock: Record<number, EventoMock> = {
            1: { evento_id: 1, titulo: "Evento 1", estado_evento: "activo" },
            2: { evento_id: 2, titulo: "Evento 2", estado_evento: "activo" },
            7: { evento_id: 7, titulo: "Evento 7", estado_evento: "activo" },
            8: { evento_id: 8, titulo: "Evento 8", estado_evento: "activo" }
        };


        (EventoDAO.findByIdsActivosAndVencidos as jest.Mock).mockImplementation(async (ids: number[]) => {
            return ids.map(id => eventosMock[id]);
        });

        // Siempre devolver 0 asistentes
        (ParticipacionDAO.countAsistentesByEventoId as jest.Mock).mockResolvedValue(0);

        // =====================================================
        // GUARDAR EVENTOS 7 y 8
        // =====================================================
        const resGuardar: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await EventosGuardadoController.guardarEvento(
            { body: { usuario_id: 2, evento_id: 7 } } as any,
            resGuardar
        );

        await EventosGuardadoController.guardarEvento(
            { body: { usuario_id: 2, evento_id: 8 } } as any,
            resGuardar
        );

        // Validar que ahora tenemos 4 guardados en memoria
        expect(guardadosMock.length).toBe(4);

        // =====================================================
        // LLAMAR devolverEventosGuardados
        // =====================================================
        const req: any = { params: { usuario_id: "2" } };
        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await EventosGuardadoController.devolverEventosGuardados(req, res);

        const respuesta = res.json.mock.calls[0][0];

        // =====================================================
        // VALIDACIONES FINALES
        // =====================================================
        expect(res.status).toHaveBeenCalledWith(200);
        expect(respuesta.success).toBe(true);
        expect(respuesta.data.total).toBe(4);
        expect(respuesta.data.eventos.length).toBe(4);
    });

});
