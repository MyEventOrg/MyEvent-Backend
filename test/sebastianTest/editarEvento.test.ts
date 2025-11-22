/**
 * ===============================================================
 * 🧪 TEST: updateEvento — editar título del evento
 * ===============================================================
 *
 * ✔ Caso:
 *   - evento_id = 10
 *   - El evento existe y está "activo"
 *   - Enviamos nuevo título "Nuevo Título Editado"
 *   - Debe llamar a EventoDAO.update con ese título
 *   - Debe responder 200 y success=true
 * ===============================================================
 */

import EventoController from "../../controllers/evento";
import EventoDAO from "../../DAO/evento";

jest.mock("../../DAO/evento");

describe("updateEvento — editar título del evento", () => {

    it("Debe actualizar el título del evento correctamente", async () => {

        const evento_id = 10;

        // 1️⃣ Mock: el evento existe y está activo
        (EventoDAO.findOne as jest.Mock).mockResolvedValue({
            get: (field: string) => {
                if (field === "estado_evento") return "activo";
                return null;
            }
        });

        // 2️⃣ Mock: actualización exitosa
        (EventoDAO.update as jest.Mock).mockResolvedValue(true);

        // 3️⃣ req y res simulados
        const req: any = {
            params: { id: evento_id.toString() },
            body: {
                titulo: "Nuevo Título Editado",
                descripcion_corta: "desc",
                descripcion_larga: "desc larga",
                tipo_evento: "publico",
                ubicacion: "Av. Lima",
                ciudad: "Lima",
                distrito: "Miraflores",
                categoria_id: 2,
                url_imagen: "img.jpg",
            }
        };

        const res: any = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };

        // 4️⃣ Ejecutar controlador
        await EventoController.updateEvento(req as any, res as any);

        // 5️⃣ Validar que llamaste a update con el nuevo título
        expect(EventoDAO.update).toHaveBeenCalledWith(
            evento_id,
            expect.objectContaining({
                titulo: "Nuevo Título Editado"
            })
        );

        // 6️⃣ Validar respuesta final
        expect(res.status).toHaveBeenCalledWith(200);

        const resp = res.json.mock.calls[0][0];

        expect(resp.success).toBe(true);
        expect(resp.message).toBe("Evento actualizado correctamente");
    });

});
