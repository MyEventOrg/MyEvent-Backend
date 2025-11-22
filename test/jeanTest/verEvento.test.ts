/**
 * TEST MINIMAL para getEvento → Rol = organizador
 */

import EventoController from "../../controllers/evento";
import UsuarioDAO from "../../DAO/usuario";
import EventoDAO from "../../DAO/evento";
import ParticipacionDAO from "../../DAO/participacion";
import InvitacionDAO from "../../DAO/invitacion";

// ============ MOCKS NECESARIOS ============
jest.mock("../../DAO/usuario");
jest.mock("../../DAO/evento");
jest.mock("../../DAO/participacion");
jest.mock("../../DAO/invitacion");

describe("getEvento → rol = organizador", () => {

    it("Debe retornar rol='organizador' con un mock mínimo", async () => {

        // ------------------------------
        // Mock usuario válido
        // ------------------------------
        (UsuarioDAO.findOne as jest.Mock).mockResolvedValue({
            get: (field: string) => {
                if (field === "usuario_id") return 1;
                if (field === "nombreCompleto") return "Juan Pérez";
                return null;
            }
        });

        // ------------------------------
        // Mock evento
        // ------------------------------
        (EventoDAO.findOne as jest.Mock).mockResolvedValue({
            get: (field: string) => {
                if (field === "estado_evento") return "activo";
                if (field === "categoria_id") return null;
                return null;
            },
            toJSON: () => ({
                evento_id: 1,
                titulo: "Evento Test"
            })
        });

        // ------------------------------
        // Mock participación como ORGANIZADOR
        // ------------------------------
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue([
            { rol_evento: "organizador" }
        ]);

        // ------------------------------
        // Mock organizador del evento
        // ------------------------------
        (ParticipacionDAO.findOrganizadorByEventoId as jest.Mock).mockResolvedValue({
            usuario_id: 1
        });

        // ------------------------------
        // Mock asistentes
        // ------------------------------
        (ParticipacionDAO.findByEventoId as jest.Mock).mockResolvedValue([]);

        // ------------------------------
        // Mock invitaciones (no aplica)
        // ------------------------------
        (InvitacionDAO.findByEventoAndUsuario as jest.Mock).mockResolvedValue(null);

        // ------------------------------
        // Mock req / res
        // ------------------------------
        const req: any = {
            params: { id: "1" },
            query: { usuario_id: "1" }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        // Ejecutar controlador
        await EventoController.getEvento(req, res);

        const resp = res.json.mock.calls[0][0];

        // ------------------------------
        // Validaciones
        // ------------------------------
        expect(res.status).toHaveBeenCalledWith(200);
        expect(resp.success).toBe(true);
        expect(resp.data.rol).toBe("organizador");
    });
});
