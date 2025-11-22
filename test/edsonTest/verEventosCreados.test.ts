/**
 * ===============================================================
 * 🧪 TEST: Flujo completo → updateEstado + getMisEventosCreados
 * ===============================================================
 *
 * ✔ Simulación real:
 *   - Usuario organizador de dos eventos (10 y 20).
 *   - Ambos empiezan en "pendiente".
 *   - Admin los activa con updateEstado.
 *   - getMisEventosCreados debe retornar ambos eventos activos.
 *
 * ✔ Validamos:
 *   - Status 200
 *   - success = true
 *   - total = 2
 *   - Ambos eventos en "activo"
 * ===============================================================
 */

import MisEventosController from "../../controllers/misEventos";
import EventoController from "../../controllers/evento";
import NotificacionController from "../../controllers/notificacion";

import ParticipacionDAO from "../../DAO/participacion";
import EventoDAO from "../../DAO/evento";

// mockear DAOs
jest.mock("../../DAO/participacion");
jest.mock("../../DAO/evento");

// mock obligatorio → evita error "evento.get is not a function"
jest.spyOn(NotificacionController, "crearNotificacionCambioEstadoEvento")
    .mockResolvedValue(undefined);


describe("Flujo completo: updateEstado → getMisEventosCreados", () => {

    it("Debe retornar 2 eventos activados por el admin", async () => {

        // 1️⃣ MOCK: Participaciones del usuario (organizador)
        (ParticipacionDAO.findByUsuarioIdAndRoles as jest.Mock).mockResolvedValue([
            { evento_id: 10 },
            { evento_id: 20 }
        ]);

        // 2️⃣ MOCK: Eventos internos del "estado"
        let eventosMock: Record<number, any> = {
            10: { evento_id: 10, titulo: "Evento A", estado_evento: "pendiente" },
            20: { evento_id: 20, titulo: "Evento B", estado_evento: "pendiente" }
        };

        // findByIds
        (EventoDAO.findByIds as jest.Mock).mockImplementation(async (ids: number[]) =>
            ids.map(id => eventosMock[id])
        );

        // findOne
        (EventoDAO.findOne as jest.Mock).mockImplementation(async (id: number) =>
            eventosMock[id]
        );

        // update → cambia el estado internamente
        (EventoDAO.update as jest.Mock).mockImplementation(async (id: number, data: any) => {
            eventosMock[id].estado_evento = data.estado_evento;
            return true;
        });

        // asistentes = 0
        (ParticipacionDAO.countAsistentesByEventoId as jest.Mock).mockResolvedValue(0);


        // 3️⃣ ADMIN activa evento 10
        const resUpdate: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await EventoController.updateEstado(
            { params: { id: "10" }, body: { estado: "activo" } } as any,
            resUpdate
        );

        // ADMIN activa evento 20
        await EventoController.updateEstado(
            { params: { id: "20" }, body: { estado: "activo" } } as any,
            resUpdate
        );

        // Verificar cambio en el mock
        expect(eventosMock[10].estado_evento).toBe("activo");
        expect(eventosMock[20].estado_evento).toBe("activo");


        // 4️⃣ Invocar MisEventos
        const req: any = { params: { usuarioId: "5" } };
        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await MisEventosController.getMisEventosCreadosActivosInactivos(req, res);

        const respuesta = res.json.mock.calls[0][0];


        // 5️⃣ Validaciones
        expect(res.status).toHaveBeenCalledWith(200);
        expect(respuesta.success).toBe(true);
        expect(respuesta.data.total).toBe(2);
        expect(respuesta.data.eventosCreados.length).toBe(2);

        expect(respuesta.data.eventosCreados[0].estado_evento).toBe("activo");
        expect(respuesta.data.eventosCreados[1].estado_evento).toBe("activo");
    });
});
