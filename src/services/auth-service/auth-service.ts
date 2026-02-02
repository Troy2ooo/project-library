import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { JwtPayload, SignOptions } from 'jsonwebtoken';

import { getOneByName, create, getOneById } from '../../models/user-model';

import { refreshToken, getRefreshToken, deleteRefreshToken, replaceRefreshToken } from '../../models/auth-models';

import ms from 'ms';

/**
 * @module AuthService
 * Сервисный модуль для аутентификации пользователей.
 *
 * Содержит функции для:
 * - регистрации пользователя,
 * - логина пользователя с выдачей JWT,
 * - получения профиля текущего пользователя.
 */

const JWT_SECRET: string = process.env.JWT_SECRET || 'dev_secret';
const SALT_ROUNDS: number = parseInt(process.env.BCRYPT_SALT_ROUNDS ?? '10', 10);
const JWT_REFRESH_SECRET: string = process.env.JWT_REFRESH_SECRET || 'refresh_secret';
const ACCESS_TOKEN_TTL = (process.env.ACCESS_TOKEN_TTL || '2h') as TTL;
const REFRESH_TOKEN_TTL = (process.env.REFRESH_TOKEN_TTL || '7d') as TTL;

type TTL = `${number}h` | `${number}d` | `${number}m`;

// type Token = {
//   id: number;
//   user_id: number;
//   token: string;
//   expires_at: Date;
// };

type TokenPayload = {
  id: number;
  username: string;
  role: string;
};

type User = {
  id: number;
  username: string;
  email: string;
  password_hash?: string;
  role: string;
  created_at?: Date;
  updated_at?: Date;
};

type AuthenticatedRequest = Request & {
  user?: User;
};

/**
 * Создаёт access token
 * @param {Object} user - объект пользователя ({ id, username, role })
 * @returns {string} access token
 */
function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
}

/**
 * Создаёт refresh token
 * @param {Object} user - объект пользователя ({ id, username })
 * @returns {string} refresh token
 */
function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
}

/**
 * Проверяет правильность пароля при входе
 * @param plainPassword
 * @param hashedPassword
 */
async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword); // сравниваем пароль и хэш и возвращает true или false, поэтому boolean
}

/**
 * Обновляет токены при истечении access-токена
 * @param req
 * @param res
 */
async function refreshAccessToken(req: Request, res: Response): Promise<Response> {
  try {
    const { refreshToken }: { refreshToken: string } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'refreshToken is required' });
    }
    // Проверяем наличие токена в базе
    const storedToken = await getRefreshToken(refreshToken);

    if (!storedToken) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }
    // Проверяем срок жизни
    if (new Date(storedToken.expires_at) < new Date()) {
      await deleteRefreshToken(refreshToken);
      return res.status(403).json({ error: 'Refresh token expired' });
    }
    // Проверяем подпись токена
    const payload = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as TokenPayload;
    // Генерируем новые токены
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(payload);
    // Меняем старый refresh на новый
    await replaceRefreshToken(payload.id, refreshToken, newRefreshToken, REFRESH_TOKEN_TTL);
    return res.status(200).json({
      message: 'Tokens refreshed successfully',
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: ACCESS_TOKEN_TTL,
    });
  } catch (err) {
    console.error('refreshAccessToken error:', err);

    return res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
}

/**
 * Проверяет access-токен
 * @param token
 */
function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (err) {
    // @ts-expect-error TS(2554): Expected 0-1 arguments, but got 2.
    throw new Error('Invalid or expired access token', err.message);
  }
}

/**
 * Регистрирует нового пользователя.
 *
 * @async
 * @function registerUser
 * @param {import('express').Request} req - Объект запроса, содержит body: { username, email, password, role }.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с данными нового пользователя.
 * @throws {Error} Если произошла ошибка при регистрации или пользователь уже существует.
 */
async function registerUser(req: Request, res: Response): Promise<Response> {
  try {
    const { username, email, password, role } = req.body;

    // Проверка обязательных полей
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    // Проверяем, есть ли уже пользователь с таким username
    const existsByName = await getOneByName(username);

    if (existsByName) {
      return res.status(400).json({ error: 'username already taken' });
    }

    // Генерируем безопасный хэш пароля
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    // Создаём пользователя, role по умолчанию 'user'
    const newUser = await create(username, email, password_hash, role || 'user');

    return res.status(201).json({
      message: 'Регистрация успешна',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error('registerUser error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Авторизует пользователя и выдает JWT-токен.
 *
 * @async
 * @function loginUser
 * @param {import('express').Request} req - Объект запроса, содержит body: { username, password }.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с JWT-токеном.
 * @throws {Error} Если произошла ошибка при логине или введены неверные данные.
 */

/**
 *
 * @param req
 * @param res
 */
async function loginUser(req: Request, res: Response): Promise<Response> {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }
    const user = await getOneByName(username);
    if (!user || !user.password_hash) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    // Проверяем пароль
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Формируем полезную нагрузку токена
    const payload = { id: user.id, username: user.username, role: user.role };
    // Генерируем токены
    const accToken = jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
    const refToken = jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
    // Сохраняем refresh-токен в базу
    // --- обрабатываем TTL ---
    const expiresAt = new Date(Date.now() + ms(REFRESH_TOKEN_TTL));
    await refreshToken(user.id, refToken, expiresAt.toISOString()); // PostgreSQL не понимает «объект Date». toISOString() - метод объекта Date, Берёт время внутри твоего Date.
    // Конвертирует в универсальное UTC-время. Возвращает строку формата ISO-8601

    return res.json({ message: 'Вход успешен', accToken, refToken, expiresIn: ACCESS_TOKEN_TTL });
  } catch (err) {
    console.error('loginUser error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

/**
 * Возвращает профиль текущего пользователя.
 *
 * @async
 * @function getProfile
 * @param {import('express').Request} req - Объект запроса, содержит user.id (из middleware авторизации).
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с данными профиля пользователя.
 * @throws {Error} Если пользователь не найден или произошла ошибка сервера.
 */
async function getProfile(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await getOneById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const profile = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };

    return res.json(profile);
  } catch (err) {
    console.error('getProfile error', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

export {
  registerUser,
  loginUser,
  getProfile,
  generateAccessToken,
  generateRefreshToken,
  verifyPassword,
  refreshAccessToken,
  verifyAccessToken,
};
