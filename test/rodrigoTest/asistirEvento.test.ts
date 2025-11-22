/**
 * ===============================================================
 * 🧪 TEST: asistenciaEvento — usuario NO participa → puede unirse
 * ===============================================================
 *
 * ✔ Caso:
 *   - evento_id = 10
 *   - usuario_id = 5
 *   - Evento es "publico"
 *   - Usuario NO está participando (findByEventoAndUsuario devuelve [])
 *
 * ✔ Qué valida:
 *   - No entra en "El usuario ya participa"
 *   - Llama a ParticipacionDAO.create()
 *   - Retorna status 200
 *   - Retorna mensaje correcto
 * ===============================================================
 */

import InvitacionController from "../../controllers/invitacion";
import EventoDAO from "../../DAO/evento";
import ParticipacionDAO from "../../DAO/participacion";
import NotificacionController from "../../controllers/notificacion";

// Solo mock que necesitamos
jest.mock("../../DAO/evento");
jest.mock("../../DAO/participacion");
jest.mock("../../controllers/notificacion");

describe("asistenciaEvento - usuario NO participa y evento público", () => {

    it("Debe permitir unirse cuando NO existe participación previa", async () => {

        const evento_id = 10;
        const usuario_id = 5;

        // 1️⃣ Mock del evento (evento público)
        (EventoDAO.findOne as jest.Mock).mockResolvedValue({
            evento_id,
            titulo: "Evento Público Test",
            tipo_evento: "publico"
        });

        // 2️⃣ Usuario NO participa → EXISTENTE = []
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue([]);

        // 3️⃣ Mock de create (para registrar asistencia)
        (ParticipacionDAO.create as jest.Mock).mockResolvedValue({
            evento_id,
            usuario_id,
            rol_evento: "asistente"
        });

        // 4️⃣ Notificación se ignora completamente
        (NotificacionController.notificarAsistenciaEvento as jest.Mock).mockResolvedValue(true);

        // req y res simulados
        const req: any = {
            body: { evento_id, usuario_id }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Ejecutar controlador
        await InvitacionController.asistenciaEvento(req, res);

        const resp = res.json.mock.calls[0][0];

        // ======================
        // VALIDACIONES FINALES
        // ======================
        expect(ParticipacionDAO.findByEventoAndUsuario).toHaveBeenCalled();

        // Se debe haber registrado como asistente
        expect(ParticipacionDAO.create).toHaveBeenCalledWith(expect.objectContaining({
            evento_id,
            usuario_id,
            rol_evento: "asistente"
        }));

        expect(res.status).toHaveBeenCalledWith(200);
        expect(resp.success).toBe(true);
        expect(resp.message).toBe("El usuario se ha unido al evento exitosamente.");
    });
});
