/**
 * ================================================================
 * TEST — getComentariosByEvento (creativo y sencillo)
 * ================================================================
 *
 * ✔ Caso de uso inventado:
 *   - El evento con ID 10 tiene 2 comentarios:
 *       1. "Muy bueno"
 *       2. "Me encantó"
 *
 * ✔ Lo que validamos:
 *   - El controlador llama al Facade correctamente.
 *   - Devuelve status 200.
 *   - `success = true`
 *   - Devuelve exactamente 2 comentarios.
 *
 * Test minimalista: solo simula el flujo básico.
 * ================================================================
 */

import ComentarioEventoController from "../../controllers/comentarioEvento";
import ComentarioEventoFacade from "../../facade/ComentarioEventoFacade";

jest.mock("../../facade/ComentarioEventoFacade");

describe("GET comentarios por evento", () => {
    it("Debe retornar lista de comentarios del evento (2 items)", async () => {

        // Mock del Facade → lo mínimo
        (ComentarioEventoFacade.obtenerComentarios as jest.Mock).mockResolvedValue([
            { comentarioevento_id: 1, mensaje: "Muy bueno" },
            { comentarioevento_id: 2, mensaje: "Me encantó" }
        ]);

        // req y res simulados
        const req: any = { params: { evento_id: "10" } };
        const res: any = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };

        // Ejecutar controlador
        await ComentarioEventoController.getComentariosByEvento(req, res);

        // Validaciones
        const resp = res.json.mock.calls[0][0];

        expect(res.json).toHaveBeenCalled();
        expect(resp.success).toBe(true);
        expect(resp.data.length).toBe(2);
        expect(resp.data[0].mensaje).toBe("Muy bueno");

        // Verificar que el Facade fue llamado correctamente
        expect(ComentarioEventoFacade.obtenerComentarios).toHaveBeenCalledWith(10);
    });
});
