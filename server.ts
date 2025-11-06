import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import cookieParser from "cookie-parser";
import { verifyMailer } from "./configs/mailer"; // 👈 opcional


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());


// -----------cookiessssss---------------------------
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  })
);
// ---------------------------------------------------

verifyMailer();

// aqui cargamos todas las rutas
const routesPath = path.join(__dirname, "routes");


// puse metodo para corroborar con todas las entidades tengan rutas, a fin de borrar al final los que esten vacios
fs.readdirSync(routesPath).forEach((file) => {
  if (file.endsWith(".ts") || file.endsWith(".js")) {
    const module = require(path.join(routesPath, file));
    const route = module.default;

    if (typeof route === "function") {
      app.use(route);
      console.log(`Ruta cargada: ${file}`);
    } else {
      console.warn(`!!!!! ${file} no exporta un router válido`);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
