import NotificacionController from "../../controllers/notificacion";
import NotificacionDAO from "../../DAO/notificacion";

jest.mock("../../DAO/notificacion");

describe("notificacionVista", () => {

    let req: any;
    let res: any;

    beforeEach(() => {
        req = { body: {} };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });

    // --------------------------------------------------------------------
    // 1. CASO EXITOSO
    // --------------------------------------------------------------------
    it("Debe marcar la notificación como vista y retornar 200", async () => {

        req.body = { notificacion_id: 10 };

        // Simula notificación actualizada
        const mockNotificacion = { notificacion_id: 10, visto: true };

        (NotificacionDAO.update as jest.Mock).mockResolvedValue(mockNotificacion);

        await NotificacionController.notificacionVista(req, res);

        expect(NotificacionDAO.update).toHaveBeenCalledWith(10, { visto: true });

        expect(res.json).toHaveBeenCalledWith({
            ok: true,
            message: "Notificación marcada como vista",
            notificacion: mockNotificacion
        });
    });

    // --------------------------------------------------------------------
    // 2. FALTA notificacion_id
    // --------------------------------------------------------------------
    it("Debe retornar 400 si no se envía notificacion_id", async () => {

        req.body = {}; // nada enviado

        await NotificacionController.notificacionVista(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "Debe enviar notificacion_id"
        });
    });

    // --------------------------------------------------------------------
    // 3. NOTIFICACIÓN NO EXISTE
    // --------------------------------------------------------------------
    it("Debe retornar 404 si la notificación no existe", async () => {

        req.body = { notificacion_id: 999 };

        // Simula que el update devuelve null → no encontrada
        (NotificacionDAO.update as jest.Mock).mockResolvedValue(null);

        await NotificacionController.notificacionVista(req, res);

        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({
            ok: false,
            message: "No se encontró la notificación"
        });
    });

});
