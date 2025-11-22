/**
 * ===============================================================
 * 🧪 TEST: getEventosFiltrados — search = "Evento"
 * ===============================================================
 *
 * ✔ Caso:
 *   Base tiene 5 eventos: A, B, C, D y "Diferente E".
 *   Cuando search="Evento", el mock devuelve los 5 eventos.
 *
 * ✔ Qué valida:
 *   - Status 200
 *   - Total = 5
 *   - data.length = 5
 * ===============================================================
 */

import EventoController from "../../controllers/evento";
import EventoDAO from "../../DAO/evento";
import EventosGuardadosDAO from "../../DAO/eventosGuardado";
import ParticipacionDAO from "../../DAO/participacion";
import InvitacionDAO from "../../DAO/invitacion";
import CategoriaDAO from "../../DAO/categoria";

jest.mock("../../DAO/evento");
jest.mock("../../DAO/eventosGuardado");
jest.mock("../../DAO/participacion");
jest.mock("../../DAO/invitacion");
jest.mock("../../DAO/categoria");

describe("getEventosFiltrados - TEST SIMPLE", () => {

    it("Debe retornar 5 eventos cuando search = 'Evento'", async () => {

        // Mock: categoría ignorable
        (CategoriaDAO.findIdByNombre as jest.Mock).mockResolvedValue(undefined);

        // Mock de eventos base (5 eventos)
        const eventosMock = [
            { evento_id: 1, titulo: "Evento A" },
            { evento_id: 2, titulo: "Evento B" },
            { evento_id: 3, titulo: "Evento C" },
            { evento_id: 4, titulo: "Evento D" },
            { evento_id: 5, titulo: "Diferente E" }
        ];

        // findFiltered → devuelve los 5 eventos sin filtrar realmente
        (EventoDAO.findFiltered as jest.Mock).mockResolvedValue(eventosMock);

        // Mock eventos guardados (vacío)
        (EventosGuardadosDAO.findByUsuarioId as jest.Mock).mockResolvedValue([]);

        // Mock countAsistentes (0)
        (ParticipacionDAO.countAsistentesByEventoId as jest.Mock).mockResolvedValue(0);

        // Mock participación e invitaciones
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue([]);
        (InvitacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue(null);

        // Request simulada
        const req: any = {
            params: { usuarioId: "10" },
            query: { search: "Evento" }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Ejecutar controlador
        await EventoController.getEventosFiltrados(req, res);

        const respuesta = res.json.mock.calls[0][0];

        // =============================
        // VALIDACIONES
        // =============================
        expect(res.status).toHaveBeenCalledWith(200);
        expect(respuesta.total).toBe(5);
        expect(respuesta.data.length).toBe(5);
    });
});
