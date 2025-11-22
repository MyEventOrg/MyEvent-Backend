/**
 * TEST SUPER CREATIVO PARA enviarInvitaciones
 * Escenario inspirado en un caso real complejo:
 *
 * - Se envía una lista con 7 correos.
 * - Algunos están duplicados.
 * - Algunos ya participan.
 * - Otros ya tienen invitación pendiente.
 * - Uno rechazó antes → bloqueado.
 * - Uno es el mismo organizador.
 * - Solo 1 termina recibiendo invitación válida.
 */

import InvitacionService from "../../services/invitacionService";

import UsuarioDAO from "../../DAO/usuario";
import EventoDAO from "../../DAO/evento";
import InvitacionDAO from "../../DAO/invitacion";
import ParticipacionDAO from "../../DAO/participacion";
import NotificacionDAO from "../../DAO/notificacion";

jest.mock("../../DAO/usuario");
jest.mock("../../DAO/evento");
jest.mock("../../DAO/invitacion");
jest.mock("../../DAO/participacion");
jest.mock("../../DAO/notificacion");

describe("enviarInvitaciones - TEST SUPER CREATIVO", () => {

    const service = new InvitacionService();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("Debe procesar una lista compleja de correos y enviar SOLO 1 invitación", async () => {

        // ============================================================
        //  Mock del evento encontrado
        // ============================================================
        (EventoDAO.findOne as jest.Mock).mockResolvedValue({
            get: (key: string) => (key === "titulo" ? "Gran Feria Tecnológica" : null)
        });

        // ============================================================
        //  Correos simulados
        // ============================================================
        const correos = [
            "a1@mail.com",
            "a1@mail.com",             // duplicado
            "noexiste@mail.com",
            "participante@mail.com",
            "pendiente@mail.com",
            "rechazo@mail.com",
            "organizador@mail.com"
        ];

        // ============================================================
        //  Mock de usuarios existentes
        // ============================================================
        const usuariosMock: Record<string, any> = {
            "a1@mail.com": { get: (k: string) => (k === "usuario_id" ? 1 : "A1") },
            "participante@mail.com": { get: (k: string) => (k === "usuario_id" ? 2 : "Participante") },
            "pendiente@mail.com": { get: (k: string) => (k === "usuario_id" ? 3 : "Pendiente") },
            "rechazo@mail.com": { get: (k: string) => (k === "usuario_id" ? 4 : "Rechazo") },
            "organizador@mail.com": { get: (k: string) => (k === "usuario_id" ? 100 : "Organizador") },
        };

        (UsuarioDAO.findByEmail as jest.Mock).mockImplementation(async (correo: string) => {
            return usuariosMock[correo] ?? null; // null → usuario no existe
        });

        // Mock del nombre del organizador
        (UsuarioDAO.findOne as jest.Mock).mockResolvedValue({
            get: () => "Juan Organizador"
        });

        // ============================================================
        //  Estado de invitaciones previas simuladas
        // ============================================================
        (InvitacionDAO.findByEventoAndUsuario as jest.Mock).mockImplementation(async (evento_id, usuario_id) => {

            if (usuario_id === 3)   // pendiente@mail.com
                return { get: () => "pendiente" };

            if (usuario_id === 4)   // rechazo@mail.com
                return { get: () => "rechazada" };

            return null; // los demás no tienen invitación previa
        });

        // ============================================================
        //  Mock de participación existente
        // ============================================================
        (ParticipacionDAO.findByEventoAndUsuario as jest.Mock).mockImplementation(async (evento, usuario) => {
            if (usuario === 2) return [{}]; // participa@mail.com
            return [];                      // otros no participan
        });

        // ============================================================
        //  Mock de creación de invitación
        // ============================================================
        (InvitacionDAO.create as jest.Mock).mockResolvedValue(true);
        (NotificacionDAO.create as jest.Mock).mockResolvedValue(true);

        // ============================================================
        //  JECUTAR SERVICIO
        // ============================================================
        const result = await service.enviarInvitaciones({
            evento_id: 50,
            organizador_id: 100,
            correos,
            mensaje: "¡Te invitamos!"
        });

        // ============================================================
        //  VALIDACIONES
        // ============================================================
        expect(result.success).toBe(true);
        expect(result.invitaciones_enviadas).toBe(1);

        expect(result.correos_no_encontrados).toEqual(["noexiste@mail.com"]);
        expect(result.correos_ya_participan).toEqual(["participante@mail.com"]);
        expect(result.correos_ya_invitados).toEqual(["pendiente@mail.com"]);
        expect(result.correos_rechazaron).toEqual(["rechazo@mail.com"]);

        // ✔ Se debe haber creado SOLO 1 invitación (para a1@mail.com)
        expect(InvitacionDAO.create).toHaveBeenCalledTimes(1);

        // ✔ También solo 1 notificación interna
        expect(NotificacionDAO.create).toHaveBeenCalledTimes(1);
    });

});
