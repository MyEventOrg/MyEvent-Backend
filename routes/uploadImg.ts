// routes/upload.ts
import { Router } from "express";
import multer from "multer";
import cloudinary from "../configs/claudinary";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload", upload.single("file"), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ ok: false, error: "No se envió archivo" });
        }

        // convertir a base64
        const b64 = file.buffer.toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;

        // subir a Cloudinary
        const result = await cloudinary.uploader.upload(dataURI, {
            folder: "eventos",
            resource_type: "image",
        });

        return res.json({ ok: true, url: result.secure_url });
    } catch (error) {
        console.error(error);
        res.status(500).json({ ok: false, error: "Error subiendo archivo" });
    }
});

export default router;
