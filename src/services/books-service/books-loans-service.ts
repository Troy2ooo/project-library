import { Request, Response } from "express";
import {
  getOneLoanById,
  turnBackBook, 
  getAll
} from '../../models/book-loans-model';

import { getOneById, updateStatus, 
} from '../../models/book-model';


/**
 * @module BookLoansService
 * Сервисный модуль для работы с займами книг.
 * 
 * Содержит функции для:
 * - получения всех займов,
 * - получения одного займа по ID,
 * - выдачи книги пользователю (checkout),
 * - возврата книги пользователем.
 */

/**
 * Получает все займы книг.
 *
 * @async
 * @function getAllLoans
 * @param {import('express').Request} req - Объект запроса.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с массивом всех займов.
 * @throws {Error} Если произошла ошибка при получении займов.
 */
async function getAllLoans(req: Request, res: Response): Promise<void> {
  try {
    const loans = await getAll();

    res.json(loans);
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting loans', error: error.message });
  }
};


/**
 * Получает один заем книги по ID.
 *
 * @async
 * @function getLoan
 * @param {import('express').Request} req - req.params.id содержит ID займа.
 * @param {import('express').Response} res
 * @returns {Promise<void>} Отправляет JSON с объектом займа.
 * @throws {Error} Если произошла ошибка при получении займа.
 */
async function getLoan(req: Request, res: Response): Promise<void> {
  const loanId = Number (req.params.id);

  try {
    const loan = await getOneLoanById(loanId);

    res.json(loan);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating loan', error: error.message });
  }
};


/**
 * Выдает книгу пользователю (checkout).
 *
 * @async
 * @function checkoutBook
 * @param {import('express').Request} req - req.params.id содержит ID книги.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом займа.
 * @throws {Error} Если книга недоступна или произошла ошибка сервера.
 */

// доработать
/**
 *
 * @param req
 * @param res
 */
async function checkoutBook(req: Request, res: Response): Promise<void> {
  const bookId = Number (req.params.id);
  
  try {
    // Проверим, доступна ли книга
    const book = await getOneById(bookId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' });
      return 
    };
    if (!book.available) {
      
      res.status(400).json({ error: 'Book is not available' });
      return
    };
    // Обновляем статус книги
    await updateStatus (bookId, false);
    res.status(201).json({
      message: 'Book checked out successfully'});
  } catch (error:any) {
    console.error('checkoutBook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};


/**
 * Возвращает книгу пользователем.
 *
 * @async
 * @function returnBook
 * @param {import('express').Request} req - req.params.id содержит ID книги, req.body.user_id содержит ID пользователя.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом возврата займа.
 * @throws {Error} Если не найден активный заем или произошла ошибка сервера.
 */
async function returnBook(req: Request, res: Response): Promise<void> {
  const bookId = Number (req.params.id);
  const userId = Number (req.body.user_id);

  try {
    const book = await getOneById (bookId);
    if (!book) {
      res.status(404).json({ error: 'Book not found' })
      return
    };
    // Проверим, есть ли незакрытый loan
    const loan = await turnBackBook(bookId, userId);
    if (!loan) {
      res.status(400).json({ error: 'No active loan found for this user/book' });
      return
    }

    // Обновляем статус книги
    await updateStatus(bookId, true);

    res.json({
      message: 'Book returned successfully',
      loan,
    });
  } catch (error:any) {
    console.error('returnBook error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}



export { getAllLoans, getLoan, checkoutBook, returnBook };
