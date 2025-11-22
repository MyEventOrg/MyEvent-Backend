/**
 * =======================================================================================
 * TEST — Flujo completo HU36 + HU37
 * Publicar dos comentarios en un evento y luego obtenerlos por getComentariosByEvento
 * =======================================================================================
 *
 * Historia simulada:
 * ---------------------------------------------------------------------------------------
 *   Evento 50 acaba de ser creado y está ACTIVO.
 *   Dos usuarios desean comentar:
 *
 *       Usuario 10: "Excelente organización!"
 *       Usuario 22: "Muy buen contenido!"
 *
 *   Luego el frontend llama a:
 *      GET /comentarios/evento/50
 *
 *   Y el sistema debe devolver exactamente esos dos comentarios ordenados.
 *
 * ✔ Validamos:
 *   - Los dos comentarios se crean correctamente (Facade)
 *   - getComentariosByEvento retorna exactamente 2 comentarios
 *   - El contenido coincide exactamente con lo que enviamos
 * =======================================================================================
 */

import ComentarioEventoController from "../../controllers/comentarioEvento";
import ComentarioEventoFacade from "../../facade/ComentarioEventoFacade";

jest.mock("../../facade/ComentarioEventoFacade");

describe("Flujo completo: Crear dos comentarios + listarlos por evento", () => {

    it("Debe crear dos comentarios y luego listarlos correctamente", async () => {

        // ===============================================================
        // Mock: Datos de los comentarios a crear
        // ===============================================================
        const EVENTO_ID = 50;
        const comentario1 = {
            comentarioevento_id: 1,
            evento_id: EVENTO_ID,
            usuario_id: 10,
            mensaje: "Excelente organización!",
        };

        const comentario2 = {
            comentarioevento_id: 2,
            evento_id: EVENTO_ID,
            usuario_id: 22,
            mensaje: "Muy buen contenido!",
        };

        // Mock de creación de comentarios
        (ComentarioEventoFacade.crearComentario as jest.Mock)
            .mockResolvedValueOnce(comentario1)   // primer comentario
            .mockResolvedValueOnce(comentario2);  // segundo comentario

        // ===============================================================
        // Mock: getComentariosByEvento devuelve ambos comentarios
        // ===============================================================
        (ComentarioEventoFacade.obtenerComentarios as jest.Mock)
            .mockResolvedValue([comentario1, comentario2]);

        // ===============================================================
        // Ejecutar creación de comentarios (2 veces)
        // ===============================================================

        const res1: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await ComentarioEventoController.createComentario(
            { body: comentario1 } as any,
            res1
        );

        const res2: any = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        await ComentarioEventoController.createComentario(
            { body: comentario2 } as any,
            res2
        );

        // Validar creación
        expect(res1.status).toHaveBeenCalledWith(201);
        expect(res2.status).toHaveBeenCalledWith(201);

        // ===============================================================
        // Ejecutar GET comentarios del evento
        // ===============================================================

        const reqGet: any = { params: { evento_id: EVENTO_ID.toString() } };
        const resGet: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        await ComentarioEventoController.getComentariosByEvento(reqGet, resGet);

        const respuesta = resGet.json.mock.calls[0][0];

        // ===============================================================
        // Validaciones finales
        // ===============================================================

        expect(respuesta.success).toBe(true);
        expect(respuesta.data.length).toBe(2);

        expect(respuesta.data[0].mensaje).toBe("Excelente organización!");
        expect(respuesta.data[1].mensaje).toBe("Muy buen contenido!");

        // Confirmar que se llamó al Facade con el evento correcto
        expect(ComentarioEventoFacade.obtenerComentarios)
            .toHaveBeenCalledWith(EVENTO_ID);
    });
});
