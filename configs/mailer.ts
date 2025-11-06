// src/config/mailer.ts
import nodemailer from "nodemailer";

const EMAIL_USER = "myevent.notification@gmail.com";
const EMAIL_PASS= "degkbmzevbfjoumk"
const EMAIL_FROM = `MyEvent <${EMAIL_USER}>`;

export const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
});

export async function verifyMailer() {
    try {
        await transporter.verify();
        console.log(`[Mailer] Listo: enviando como ${EMAIL_FROM}`);
    } catch (e) {
        console.error("[Mailer] Error al verificar:", e);
    }
}

export const MAIL = {
    FROM: EMAIL_FROM,
    USER: EMAIL_USER,
};
