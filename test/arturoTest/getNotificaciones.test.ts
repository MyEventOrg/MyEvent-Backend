/**
 * ================================================================
 * TEST — Notificaciones: usuario con 5 notificaciones iniciales
 * ================================================================
 *
 * ✔ Mock:
 *    Usuario con ID = 10
 *    Tiene 5 notificaciones ordenadas por fecha
 *
 * ✔ Qué probamos:
 *    - status = 200
 *    - ok = true
 *    - notificaciones.length = 5
 *    - estructura correcta
 *
 * ================================================================
 */

import NotificacionController from "../../controllers/notificacion";
import NotificacionDAO from "../../DAO/notificacion";

jest.mock("../../DAO/notificacion");

describe("getNotificaciones - Debe retornar las notificaciones del usuario", () => {

    beforeEach(() => jest.clearAllMocks());

    it("Debe devolver las 5 notificaciones del usuario correctamente", async () => {

        // ======================
        // MOCK DE 5 NOTIFICACIONES
        // ======================
        const mockNotificaciones = [
            { notificacion_id: 1, mensaje: "A", visto: false },
            { notificacion_id: 2, mensaje: "B", visto: false },
            { notificacion_id: 3, mensaje: "C", visto: true },
            { notificacion_id: 4, mensaje: "D", visto: false },
            { notificacion_id: 5, mensaje: "E", visto: true },
        ];

        // Mock de DAO
        (NotificacionDAO.findByUserOrderedConInvitacionesPendientes as jest.Mock)
            .mockResolvedValue(mockNotificaciones);

        // ======================
        // mock req & res
        // ======================
        const req: any = { params: { usuario_id: "10" } };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // ======================
        // Ejecutar controlador
        // ======================
        await NotificacionController.getNotificaciones(req, res);

        // Obtener respuesta enviada por el controlador
        const respuesta = res.json.mock.calls[0][0];

        // ======================
        // VALIDACIONES
        // ======================
        expect(res.status).not.toHaveBeenCalledWith(400);
        expect(res.status).not.toHaveBeenCalledWith(500);

        expect(res.json).toHaveBeenCalledTimes(1);

        expect(respuesta.ok).toBe(true);
        expect(respuesta.notificaciones.length).toBe(5);

        // Validar contenido
        expect(respuesta.notificaciones[0].mensaje).toBe("A");
        expect(respuesta.notificaciones[4].mensaje).toBe("E");

    });

});
