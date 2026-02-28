import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userRepository from "../repositories/userRepository.js";

const JWT_SECRET = process.env.JWT_SECRET || "farmasi-secret-key";

export const login = async (email: string, password: string) => {
  const user = await userRepository.findUserByEmail(email);
  
  if (!user) {
    throw new Error("Usuario no encontrado");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  
  if (!isPasswordValid) {
    throw new Error("Contraseña incorrecta");
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, rol: user.rol, company_id: user.company_id },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      rol: user.rol,
      company_id: user.company_id,
      company_name: user.company?.nombre_empresa
    }
  };
};

