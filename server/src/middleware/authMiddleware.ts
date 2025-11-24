import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
    id: number;
    email: string;
    role?: string;
}

export interface AuthenticatedRequest extends Request {
    user?: AuthenticatedUser;
}

const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization header missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }
    const secret = process.env.JWT_SECRET as string;

    if (!secret) {
        console.error('JWT_SECRET is not defined');
        res.status(500).json({ message: 'Authentication misconfigured' });
        return;
    }

    try {
        const payload = jwt.verify(token, secret) as jwt.JwtPayload;
        const userId = Number(payload.sub);

        if (!Number.isInteger(userId)) {
            return res.status(401).json({ message: 'Invalid token payload' });
        }

        const userPayload: AuthenticatedUser = {
            id: userId,
            email: typeof payload.email === 'string' ? payload.email : '',
        };

        if (typeof payload.role === 'string') {
            userPayload.role = payload.role;
        }

        req.user = userPayload;

        return next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export default authenticate;