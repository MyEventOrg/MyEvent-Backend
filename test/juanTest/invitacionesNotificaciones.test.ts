/**
 * ================================================================
 * TEST ÉPICO – El flujo social de invitaciones en un evento
 * ================================================================
 * Escenario:
 * - Existe un evento "Cumbre de Arquitectos".
 * - El usuario 50 (Martín Vivanco) tiene una invitación PENDIENTE.
 * - Hay 2 asistentes ya confirmados.
 * - Se valida que:
 *    ✔ obtenerInvitacionPendiente ➜ devuelve la invitación pendiente
 *    ✔ obtenerAsistentesEvento ➜ devuelve los 2 asistentes
 *    ✔ obtenerInvitacionesPendientes ➜ devuelve 1 invitación pendiente
 * 
 * Este test evalúa la interacción social real dentro del sistema.
 * ================================================================
 */

import InvitacionController from "../../controllers/invitacion";
import InvitacionDAO from "../../DAO/invitacion";
import ParticipacionDAO from "../../DAO/participacion";

jest.mock("../../DAO/invitacion");
jest.mock("../../DAO/participacion");

describe("Flujo Social de Invitaciones – HU40 / HU41", () => {

    // Mocks de respuesta tipo Express
    const mockRes = () => {
        const res: any = {};
        res.status = jest.fn().mockReturnValue(res);
        res.json = jest.fn().mockReturnValue(res);
        return res;
    };

    it("obtenerInvitacionPendiente – debería devolver la invitación PENDIENTE", async () => {
        const req: any = { params: { evento_id: "10", usuario_id: "50" } };
        const res = mockRes();

        // Mock: la invitación pendiente
        (InvitacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue({
            get: (key: string) => (key === "estado" ? "pendiente" : null)
        });

        await InvitacionController.obtenerInvitacionPendiente(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            success: true,
            data: expect.any(Object)
        });
    });

    it("obtenerAsistentesEvento – debería listar 2 asistentes confirmados", async () => {
        const req: any = { params: { id: "10" } };
        const res = mockRes();

        // Mock de asistentes
        (ParticipacionDAO.findAsistentesConUsuario as jest.Mock).mockResolvedValue([
            { usuario_id: 21, nombre: "Ana", correo: "ana@mail.com" },
            { usuario_id: 22, nombre: "Luis", correo: "luis@mail.com" }
        ]);

        await InvitacionController.obtenerAsistentesEvento(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0].data;

        expect(data.length).toBe(2);
        expect(data[0].usuario_id).toBe(21);
        expect(data[1].usuario_id).toBe(22);
    });

    it("obtenerInvitacionesPendientes – usuario tiene 1 invitación pendiente", async () => {
        const req: any = { params: { usuario_id: "50" } };
        const res = mockRes();

        // Mock de invitación pendiente
        (InvitacionDAO.findPendientesByUsuario as jest.Mock).mockResolvedValue([
            { invitacion_id: 900, evento_id: 10, estado: "pendiente" }
        ]);

        await InvitacionController.obtenerInvitacionesPendientes(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        const data = res.json.mock.calls[0][0].data;

        expect(data.length).toBe(1);
        expect(data[0].estado).toBe("pendiente");
    });

});
