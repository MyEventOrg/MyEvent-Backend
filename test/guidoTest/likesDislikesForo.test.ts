/**
 * ==============================================================
 * TEST — Recuentos reales de Likes / Dislikes (5 usuarios)
 * ==============================================================
 *
 * Estado inicial del comentario:
 *   likes = 19
 *   dislikes = 6
 *
 * Interacciones:
 *   - Usuario 1 → like
 *   - Usuario 2 → like
 *   - Usuario 3 → like
 *   - Usuario 4 → dislike
 *   - Usuario 5 → dislike
 *
 * Resultado esperado:
 *   likes finales = 22
 *   dislikes finales = 8
 * ==============================================================
 */

import ComentarioEventoController from "../../controllers/comentarioEvento";
import ComentarioEventoDAO from "../../DAO/comentarioEvento";

jest.mock("../../DAO/comentarioEvento");

describe("Recuento real de Likes/Dislikes con 5 usuarios", () => {

    beforeEach(() => jest.clearAllMocks());

    // Estado inicial del comentario
    const comentarioInicial = {
        comentarioevento_id: 77,
        mensaje: "Excelente evento",
        usuario_id: 10,
        evento_id: 5,
        likes: 19,
        dislikes: 6
    };

    // Mock básico de res
    const mockRes = () => ({
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
    });

    // Utilidad para simular las llamadas consecutivas a findOne
    const buildFindOneMock = () => {
        (ComentarioEventoDAO.findOne as jest.Mock).mockImplementation(async () => {
            return { ...comentarioInicial };
        });
    };

    it("Debe terminar con 22 likes y 8 dislikes", async () => {

        buildFindOneMock();

        // Mock update → actualiza valores dentro de comentarioInicial
        (ComentarioEventoDAO.update as jest.Mock).mockImplementation(async (id, data) => {
            if (data.likes !== undefined) comentarioInicial.likes = data.likes;
            if (data.dislikes !== undefined) comentarioInicial.dislikes = data.dislikes;
        });

        // ======== 3 usuarios dan LIKE ========
        const usersLikes = [101, 102, 103];

        for (const u of usersLikes) {
            const res = mockRes();
            await ComentarioEventoController.updateLikes(
                { params: { comentario_id: "77" }, body: { action: "like" } } as any,
                res as any
            );
        }

        // ======== 2 usuarios dan DISLIKE ========
        const usersDislikes = [201, 202];

        for (const u of usersDislikes) {
            const res = mockRes();
            await ComentarioEventoController.updateDislikes(
                { params: { comentario_id: "77" }, body: { action: "dislike" } } as any,
                res as any
            );
        }

        // ================================
        // VALIDACIÓN FINAL DEL TEST
        // ================================
        expect(comentarioInicial.likes).toBe(22);
        expect(comentarioInicial.dislikes).toBe(8);

        console.log("👍 Likes finales:", comentarioInicial.likes);
        console.log("👎 Dislikes finales:", comentarioInicial.dislikes);
    });

});
