/**
 * ===============================================================
 * 🧪 TEST: getEventosAsistidos → Usuario 2 asiste a 2 eventos
 * ===============================================================
 *
 * ✔ Caso simulado:
 *   - Usuario 2 tiene participación como "asistente" en eventos 6 y 7.
 *   - EventoDAO.findByIds devuelve los 2 eventos.
 *   - countAsistentesByEventoId devuelve 0 siempre (mock).
 *
 * ✔ Validamos:
 *   - status = 200
 *   - success = true
 *   - total = 2
 *   - eventosAsistiendo.length = 2
 * ===============================================================
 */

import AsistenciaController from "../../controllers/asistencia";
import ParticipacionDAO from "../../DAO/participacion";
import EventoDAO from "../../DAO/evento";

// Mockear DAOs
jest.mock("../../DAO/participacion");
jest.mock("../../DAO/evento");

describe("getEventosAsistidos - usuario 2 asistiendo a 2 eventos", () => {

    it("Debe retornar 2 eventos asistidos", async () => {

        // ================================
        // 1️⃣ Mock: Participación del usuario
        // ================================
        (ParticipacionDAO.findByUsuarioIdAndRoles as jest.Mock).mockResolvedValue([
            { evento_id: 6 },
            { evento_id: 7 }
        ]);

        // ================================
        // 2️⃣ Mock: Datos de los eventos
        // ================================
        const eventosMock: any = {
            6: { evento_id: 6, titulo: "Evento 6", estado_evento: "activo" },
            7: { evento_id: 7, titulo: "Evento 7", estado_evento: "activo" }
        };

        (EventoDAO.findByIds as jest.Mock).mockImplementation(async (ids: number[]) => {
            return ids.map(id => eventosMock[id]);
        });

        // ================================
        // 3️⃣ Mock: asistentes count
        // ================================
        (ParticipacionDAO.countAsistentesByEventoId as jest.Mock).mockResolvedValue(0);

        // ================================
        // 4️⃣ Simular req / res
        // ================================
        const req: any = { params: { usuarioId: "2" } };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Ejecutar
        await AsistenciaController.getEventosAsistidos(req, res);

        // ================================
        // 5️⃣ Validaciones
        // ================================
        const respuesta = res.json.mock.calls[0][0];

        expect(res.status).toHaveBeenCalledWith(200);
        expect(respuesta.success).toBe(true);
        expect(respuesta.data.total).toBe(2);
        expect(respuesta.data.eventosAsistiendo.length).toBe(2);
    });

});
