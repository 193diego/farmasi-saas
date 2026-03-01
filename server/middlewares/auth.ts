import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "farmasi_secret_key";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    company_id: number | null;
    rol: string;
    nombre: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = (req as Request).headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return void res.status(401).json({ message: "Token no proporcionado" });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return void res.status(403).json({ message: "Token inválido o expirado" });
    req.user = user;
    next();
  });
};

export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.rol)) {
      return void res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
    }
    next();
  };
};