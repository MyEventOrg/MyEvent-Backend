import { Request } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = "w93nf93nfw94f0w9fn39f0wf_uf9834fh94hf9h3h9h39fh39";

export type JwtPayload = {
  usuario_id: number;
  apodo?: string | null;
  rol: string;
  url_imagen?: string | null;
  iat?: number;
  exp?: number;
};

export function getUserFromRequest(req: Request): JwtPayload {
  // 1) Authorization: Bearer <token>
  const rawAuth = req.headers.authorization;
  const bearer = rawAuth && rawAuth.startsWith("Bearer ")
    ? rawAuth.slice(7)
    : undefined;

  // 2) Fallback a cookie
  const cookieToken = (req as any).cookies?.token as string | undefined;
  const token = bearer || cookieToken;

  if (!token) {
    const err: any = new Error("No autenticado");
    err.status = 401;
    throw err;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    if (!decoded?.usuario_id) {
      const err: any = new Error("Token inválido");
      err.status = 401;
      throw err;
    }
    return decoded;
  } catch {
    const err: any = new Error("Token inválido");
    err.status = 401;
    throw err;
  }
}
