import jwt, { JwtPayload } from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
const JWT_SECRET: string = process.env.JWT_SECRET || 'dev_secret';

type AuthenticatedRequest = Request & {
  user?: JwtPayload & { id: number; username: string; role: string };
}

/**
 * @file Middleware для аутентификации пользователей по JWT.
 * Проверяет наличие и корректность токена в заголовке Authorization.
 * Если токен валиден — добавляет данные пользователя в req.user и передаёт управление дальше.
 * Если токен отсутствует или недействителен — возвращает ошибку 401 или 403.
 *
 * @module middleware/authenticateToken
 */

/**
 * Проверяет JWT-токен из заголовка Authorization.
 * 
 * @param {import('express').Request} req - Объект запроса Express.
 * @param {import('express').Response} res - Объект ответа Express.
 * @param {import('express').NextFunction} next - Функция, передающая управление следующему middleware.
 * 
 * @returns {void}
 * 
 * @example
 * // Использование:
 * const { authenticateToken } = require('./middleware/auth');
 * app.get('/profile', authenticateToken, (req, res) => {
 * res.json({ user: req.user });
 * });
 */
function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const parts = authHeader.split(' ');

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format' });
  }

  const token = parts[1];

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = payload as AuthenticatedRequest['user'];

    next();
  });
}
export { authenticateToken };



