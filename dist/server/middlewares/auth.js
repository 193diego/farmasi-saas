import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET || "farmasi_secret_key";
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token)
        return res.status(401).json({ message: "Token no proporcionado" });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err)
            return res.status(403).json({ message: "Token inválido o expirado" });
        req.user = user;
        next();
    });
};
export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.rol)) {
            return res.status(403).json({ message: "No tienes permisos para realizar esta acción" });
        }
        next();
    };
};
