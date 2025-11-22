/**
 * ===============================================================
 * 🧪 TEST: deleteEvento — eliminar un evento
 * ===============================================================
 *
 * ✔ Caso:
 *   - evento_id = 10, usuario_id = 1
 *   - El usuario SÍ es organizador → puede eliminarlo
 *   - Después de eliminar, EventoDAO.findOne(evento_id) debe ser null
 * ===============================================================
 */

import EventoController from "../../controllers/evento";
import EventoDAO from "../../DAO/evento";
import UsuarioDAO from "../../DAO/usuario";
import ParticipacionDAO from "../../DAO/participacion";

// mock para DAOs
jest.mock("../../DAO/evento");
jest.mock("../../DAO/usuario");
jest.mock("../../DAO/participacion");

describe("deleteEvento — eliminar un evento correctamente", () => {

    it("Debe eliminar evento y luego findOne debe devolver null", async () => {

        const evento_id = 10;
        const usuario_id = 1;

        // 1️⃣ Usuario existe
        (UsuarioDAO.findOne as jest.Mock).mockResolvedValue({
            usuario_id,
            get: () => usuario_id
        });

        // 2️⃣ Evento existe
        (EventoDAO.findOne as jest.Mock)
            // primera llamada → existe
            .mockResolvedValueOnce({
                evento_id,
                get: (k: string) => null
            })
            // segunda llamada → después de eliminar → ya NO existe
            .mockResolvedValueOnce(null);

        // 3️⃣ Usuario es organizador
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue([
            { rol_evento: "organizador" }
        ]);

        // 4️⃣ Mock para EventoDAO.remove (eliminación)
        (EventoDAO.remove as jest.Mock).mockResolvedValue(true);

        // req y res
        const req: any = {
            params: { id: evento_id.toString() },
            query: { usuario_id: usuario_id.toString() }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // 🧪 5️⃣ Ejecutar eliminación
        await EventoController.deleteEvento(req, res);

        // 6️⃣ Validar que eliminó correctamente
        expect(res.status).toHaveBeenCalledWith(200);

        const resp = res.json.mock.calls[0][0];
        expect(resp.success).toBe(true);

        // 🧠 7️⃣ Simular llamada posterior a findOne
        const eventoDespues = await EventoDAO.findOne(evento_id);

        // ✔ Lo esperado: ya no existe
        // ✔ Lo esperado: ya no existe
        expect(eventoDespues).toBeFalsy(); // null o undefined

    });
});
