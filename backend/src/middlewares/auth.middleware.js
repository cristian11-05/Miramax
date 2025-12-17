import jwt from 'jsonwebtoken';

// Middleware para verificar el token JWT
export const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token inválido o expirado.' });
        }
        req.user = user;
        next();
    });
};

// Middleware para verificar roles específicos
export const authorizeRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado.' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'No tienes permisos para realizar esta acción.',
                requiredRoles: roles
            });
        }

        next();
    };
};
