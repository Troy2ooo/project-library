import { Request, Response } from 'express';
import { updateMail, update, remove, getAll, create, getOneById, getOneByName } from '../../models/user-model';
import bcrypt from 'bcryptjs';

/**
 * @module UserService
 * Сервисный модуль для работы с пользователями.
 *
 * Содержит функции для:
 * - получение всех пользователей,
 * - получение одного пользователя по ID,
 * - создание нового пользователя,
 * - удаление пользователя по ID,
 * - обновление информации пользователя,
 * - обновление электронной почты пользователя.
 */

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

type UserCreateRequestDto = {
  userName: string;
  email: string;
  password: string;
  role: string;
};

type UserUpdateRequestDto = Omit<UserCreateRequestDto, 'password' | 'role'>;

type UpdateUserMailRequestDto = {
  userId: number;
  newMail: string;
};
/**
 * Получает всех пользователей.
 *
 * @async
 * @function getAllUsers
 * @param {import('express').Request} req - Объект запроса.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с массивом пользователей.
 * @throws {Error} Если произошла ошибка при выполнении запроса к базе данных.
 */
async function getAllUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await getAll();
    // Метод .map():
    // проходит по каждому элементу массива;
    // применяет к нему функцию, которую ты передаёшь;
    // возвращает новый массив с результатами этой функции.
    const usersData = users.map((user: User) => ({
      id: user.id,
      name: user.username,
      mail: user.email,
      role: user.role,
    }));

    res.json({
      message: 'Here we go, all users!',
      usersData,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting all users', error: error.message });
  }
}

/**
 * Получает одного пользователя по ID.
 *
 * @async
 * @function getOneUser
 * @param {import('express').Request} req - Объект запроса, содержит params.id.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с данными пользователя.
 * @throws {Error} Если произошла ошибка при выполнении запроса к базе данных.
 */

// Express всегда передаёт параметры в строковом виде, даже если это числа в URL.
// То есть Express никогда не даст тебе number внутри req.params.
// Поэтому правильное решение — сначала принять как string, потом привести к number

async function getOneUser(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.id);

  try {
    console.log(userId);

    const user = await getOneById(userId);

    res.json({
      message: 'Here we go user',
      userData: {
        id: user.id,
        name: user.username,
        mail: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting user', error: error.message });
  }
}

type AuthenticatedRequest = Request & {
  // пересечение типов (&) подобно extends для interface
  user?: {
    //? потому что свойство user может быть, а может отсутствовать в объекте req
    id: number;
    username: string;
    email: string;
    role: string;
  };
};

/**
 * Создает нового пользователя.
 *
 * @async
 * @function createUser
 * @param {import('express').Request} req - Объект запроса, содержит body: { name, mail, password, role }.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с данными созданного пользователя.
 * @throws {Error} Если произошла ошибка при создании пользователя или нарушении уникальности.
 */
async function createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { userName, email, password, role } = req.body as UserCreateRequestDto;

    if (!userName || !email || !password) {
      res.status(400).json({ message: 'Name, mail, and password are required' });
      return;
    }

    // число “раундов” соли (или “сложность” хэширования).
    // Соль — это случайная добавка к паролю перед хэшированием.
    // Она делает хэш уникальным.
    const saltRounds = 10;

    // bcrypt генерирует соль (автоматически, исходя из saltRounds).
    // Затем смешивает соль с паролем и создаёт хэш
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Определяем роль (по умолчанию "user")
    let userRole = 'user';
    if (role === 'admin') {
      if (req.user && req.user.role === 'admin') {
        userRole = 'admin'; // админ может создать другого админа
      } else {
        res.status(403).json({ error: 'Only admins can assign the admin role' });
        return;
      }
    }
    const newUser = await create(userName, email, password_hash, userRole);
    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser.id,
        name: newUser.username,
        mail: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
}

/**
 * Удаляет пользователя по ID.
 *
 * @async
 * @function deleteUser
 * @param {import('express').Request} req - Объект запроса, содержит params.id.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с данными удаленного пользователя.
 * @throws {Error} Если произошла ошибка при удалении пользователя.
 */
async function deleteUser(req: Request, res: Response): Promise<void> {
  const userId: number = Number(req.params.id);
  try {
    const deletedUser = await remove(userId);
    if (deletedUser) {
      res.json({ message: 'User deleted successfully', user: deletedUser });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
}

/**
 * Обновляет имя и/или email пользователя.
 *
 * @async
 * @function updateUser
 * @param {import('express').Request} req - Объект запроса, содержит body: { userId, userName, email }.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с обновленными данными пользователя.
 * @throws {Error} Если произошла ошибка при обновлении.
 */

async function updateUser(req: Request, res: Response): Promise<void> {
  try {
    const { userName, email } = req.body as UserUpdateRequestDto;
    const userId = Number(req.params.id);

    console.log(req.params);
    console.log({ userId, userName, email });

    if (!userId) {
      res.status(400).json({ message: 'userId is required' });
      return;
    }

    // Создаем объект только с полями, которые пришли
    const fieldsToUpdate: UserUpdateRequestDto = { userName: '', email: '' };

    if (userName) {
      fieldsToUpdate.userName = userName;
    }

    if (email) {
      fieldsToUpdate.email = email;
    }

    const updatedUser = await update(userId, fieldsToUpdate);

    if (!updatedUser) {
      res.status(404).json({ message: 'User not found or nothing to update' });
      return;
    }

    const { password_hash, created_at, updated_at, ...userData } = updatedUser;

    res.status(200).json({ message: 'User updated successfully', user: userData });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

/**
 * Обновляет email пользователя.
 *
 * @async
 * @function updateUserMail
 * @param {import('express').Request} req - Объект запроса, содержит body: { userId, newMail }.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с обновленным email пользователя.
 * @throws {Error} Если произошла ошибка при обновлении email.
 */
async function updateUserMail(req: Request, res: Response) {
  if (!req.body) {
    console.log('Paramets are reqiered');
    res.status(400).json({ message: 'Paramets are reqiered' });
    return;
  }

  try {
    const body: UpdateUserMailRequestDto = req.body;
    const { userId, newMail } = body;
    const result = await updateMail(newMail, userId);

    if (result) {
      res.status(200).json({ message: 'User email updated', user: result });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error: any) {
    console.error('Error updating user name:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export { getAllUsers, getOneUser, createUser, deleteUser, updateUser, updateUserMail };
