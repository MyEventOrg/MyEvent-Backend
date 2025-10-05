// routes/upload.ts
import { Router } from "express";
import { FileUploadService } from "../helpers/fileUpload";

const router = Router();

// Endpoint específico para imágenes
router.post("/upload/image", FileUploadService.getImageMulterConfig().single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ ok: false, error: "No se envió archivo" });
        }

        // Validar que sea específicamente una imagen
        const validation = FileUploadService.validateImageFile(file);
        if (!validation.valid) {
            return res.status(400).json({ ok: false, error: validation.error });
        }

        // Subir archivo usando el servicio unificado
        const result = await FileUploadService.uploadFile(file);
        
        if (result.success) {
            return res.json({ ok: true, url: result.url });
        } else {
            return res.status(500).json({ ok: false, error: result.message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Error subiendo imagen" });
    }
});

// Endpoint específico para PDFs
router.post("/upload/pdf", FileUploadService.getPdfMulterConfig().single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ ok: false, error: "No se envió archivo" });
        }

        // Validar que sea específicamente un PDF
        const validation = FileUploadService.validatePdfFile(file);
        if (!validation.valid) {
            return res.status(400).json({ ok: false, error: validation.error });
        }

        // Subir archivo usando el servicio unificado
        const result = await FileUploadService.uploadFile(file);
        
        if (result.success) {
            return res.json({ ok: true, url: result.url });
        } else {
            return res.status(500).json({ ok: false, error: result.message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Error subiendo PDF" });
    }
});

// Endpoint general (mantener compatibilidad)
router.post("/upload", FileUploadService.getMulterConfig().single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ ok: false, error: "No se envió archivo" });
        }

        // Validar archivo
        const validation = FileUploadService.validateFile(file);
        if (!validation.valid) {
            return res.status(400).json({ ok: false, error: validation.error });
        }

        // Subir archivo usando el servicio unificado
        const result = await FileUploadService.uploadFile(file);
        
        if (result.success) {
            return res.json({ ok: true, url: result.url });
        } else {
            return res.status(500).json({ ok: false, error: result.message });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Error subiendo archivo" });
    }
});

export default router;
