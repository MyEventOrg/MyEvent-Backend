/**
 * ===============================================================
 * 🧪 TEST: anularAsistenciaEvento — usuario ya NO está inscrito
 * ===============================================================
 *
 * ✔ Caso:
 *   - usuario_id = 5
 *   - evento_id = 10
 *   - Antes: sí está inscrito → remove()
 *   - Después: NO está inscrito → findByEventoAndUsuario devuelve []
 *
 * ✔ Qué valida:
 *   - Se eliminó la participación
 *   - La segunda llamada responde 404
 *   - Mensaje "El usuario no está inscrito en este evento."
 * ===============================================================
 */

import InvitacionController from "../../controllers/invitacion";
import ParticipacionDAO from "../../DAO/participacion";
import NotificacionController from "../../controllers/notificacion";

jest.mock("../../DAO/participacion");
jest.mock("../../controllers/notificacion");

describe("anularAsistenciaEvento — usuario ya no está inscrito", () => {

    it("Debe retornar 404 cuando ya no está inscrito tras eliminar asistencia", async () => {

        const evento_id = 10;
        const usuario_id = 5;

        // 1️⃣ Primera llamada → sí está inscrito (asistente)
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock)
            .mockResolvedValueOnce([
                {
                    participacion_id: 777,
                    evento_id,
                    usuario_id,
                    rol_evento: "asistente"
                }
            ])
            // 2️⃣ Segunda llamada → ya NO está inscrito
            .mockResolvedValueOnce([]);

        // Mock remove
        (ParticipacionDAO.remove as jest.Mock).mockResolvedValue(true);

        // Ignorar notificación
        (NotificacionController.notificarAnuloAsistenciaEvento as jest.Mock)
            .mockResolvedValue(true);

        const req: any = {
            body: { evento_id, usuario_id }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // PRIMERA EJECUCIÓN — elimina asistencia
        await InvitacionController.anularAsistenciaEvento(req, res);

        expect(ParticipacionDAO.remove).toHaveBeenCalledWith(777);

        // =============================
        // SEGUNDA EJECUCIÓN — ya no está inscrito
        // =============================

        const res2: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await InvitacionController.anularAsistenciaEvento(req, res2);

        const resp2 = res2.json.mock.calls[0][0];

        // ======================
        // VALIDACIONES FINALES
        // ======================

        expect(res2.status).toHaveBeenCalledWith(404);
        expect(resp2.success).toBe(false);
        expect(resp2.message).toBe("El usuario no está inscrito en este evento.");
    });
});
