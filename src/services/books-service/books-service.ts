import { Request, Response } from "express";
import { getAll,
  getAllWithAuthors,
  getOneById,
  getOneWithAuthorById,
  create,
  remove,
  updateStatus } from '../../models/book-model'

/**
 * @module BookService
 * Сервисный модуль для работы с книгами.
 * 
 * Содержит функции для:
 * - получения всех книг,
 * - получения всех книг с авторами,
 * - получения книги по ID,
 * - получения книги с автором по ID,
 * - создания книги,
 * - удаления книги по ID,
 * - обновления статуса доступности книги.
 */

type BookCreateRequestDto = {
  title: string;
  description: string;
  available: boolean;
}


/**
 * Получает все книги.
 *
 * @async
 * @function getAllBooks
 * @param {import('express').Request} req - Объект запроса.
 * @param {import('express').Response} res - Объект ответа.
 * @returns {Promise<void>} Отправляет JSON с массивом всех книг.
 * @throws {Error} Если произошла ошибка при получении книг.
 */
async function getAllBooks(req: Request, res: Response) {
  try {
    const books = await getAll();

    res.json(books);
  } catch (error) {
    // @ts-expect-error TS(2339): Property 'message' does not exist on type 'unknown... Remove this comment to see the full error message
    res.status(500).json({ message: 'Error getting books', error: error.message });
  }
}


/**
 * Получает все книги с их авторами.
 *
 * @async
 * @function getAllBooksWithAuthors
 * @param {import('express').Request} req - Объект запроса Express.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с массивом всех книг и их авторов.
 * @throws {Error} Если произошла ошибка при получении книг.
 */
async function getAllBooksWithAuthors(req: any, res: any) {
  try {
    const books = await getAllWithAuthors();
    res.json(books);
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting books', error: error.message });
  }
}



/**
 * Получает книгу по ID.
 *
 * @async
 * @function getBookById
 * @param {import('express').Request} req - req.params.id содержит ID книги.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом книги.
 * @throws {Error} Если произошла ошибка при получении книги.
 */
async function getBookById(req: any, res: any) {
  const bookId = req.params.id;

  try {
    const book = await getOneById(bookId);

    res.json(book);
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
}


/**
 * Получает книгу с автором по ID.
 *
 * @async
 * @function getBookWithAuthor
 * @param {import('express').Request} req - req.params.id содержит ID книги.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом книги и автором.
 * @throws {Error} Если книга не найдена или произошла ошибка сервера.
 */
async function getBookWithAuthor(req: Request, res: Response) {
  try {
    const bookId = req.params.id;
    const book = await getOneWithAuthorById(bookId);

    if (!book) {
      return res.status(404).json({ error: 'Книга не найдена' });
    }

    res.json(book);
  } catch (error: any) {
    console.error('Ошибка при получении книги:', error);
    res.status(500).json({ error: 'Ошибка при получении книги' });
  }
}


/**
 * Создает новую книгу.
 *
 * @async
 * @function createBook
 * @param {import('express').Request} req - req.body содержит { title, description, available }.
 * @param {import('express').Response} res - - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом созданной книги.
 * @throws {Error} Если произошла ошибка при создании книги.
 */
async function createBook(req: Request, res: Response) {
  const book: BookCreateRequestDto = {
    title: req.body.title,
    description: req.body.description,
    available: req.body.available ? req.body.available : true,
  };

  try {
    const newBook = await create(book.title, book.description, book.available);

    res.json({ message: 'Book created successfully', book: newBook });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating book', error: error.message });
  }
}


/**
 * Удаляет книгу по ID.
 *
 * @async
 * @function deleteBook
 * @param {import('express').Request} req - req.params.id содержит ID книги.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с объектом удаленной книги или сообщение об ошибке.
 */
async function deleteBook(req: Request, res: Response) {
  const bookId: number = Number(req.params.id);

  const deletedBook = await remove(bookId);

  if (deletedBook) {
    res.json({ message: 'Book deleted successfully', book: deletedBook });
  } else {
    res.status(404).json({ message: 'Book not found' });
  }
}



/**
 * Обновляет статус доступности книги по ID.
 *
 * @async
 * @function updateBookStatus
 * @param {import('express').Request} req - req.params.id содержит ID книги, req.body.available содержит true/false.
 * @param {import('express').Response} res - Объект ответа Express.
 * @returns {Promise<void>} Отправляет JSON с обновленным объектом книги.
 * @throws {Error} Если произошла ошибка при обновлении книги.
 */
async function updateBookStatus(req: Request, res: Response) {
  try {
    const bookId: number = Number(req.params.id);
    const { available } = req.body as { available: boolean };

    if (typeof available !== 'boolean') {
      return res.status(400).json({ error: 'available must be a boolean (true/false)' });
    }

    const updatedBook = await updateStatus(bookId, available);

    if (!updatedBook) {
      return res.status(404).json({ error: 'Book not found' });
    }

    res.json({
      message: `Book ${bookId} status updated successfully`,
      book: updatedBook,
    });
  } catch (error) {
    console.error('updateBookStatus error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}

export {
  getAllBooks,
  getAllBooksWithAuthors,
  getBookById,
  getBookWithAuthor,
  createBook,
  deleteBook,
  updateBookStatus,
};
