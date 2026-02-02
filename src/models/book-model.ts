import {pool} from '../../db'

/**
 * @module BookModel
 * Модуль для работы с таблицей `book` в базе данных.
 * 
 * Содержит функции для:
 * - получение всех книг,
 * - получение одной книги по ID,
 * - получение всех книг с авторами,
 * - получение одной книги с автором по ID,
 * - создание книг,
 * - удаление книги по ID,
 * - обновление статуса доступности книги по ID
 */


/**
 * пользовательский тип, описывающий свойства объекта, который содержит данные о книгах.
 * 
 * @typedef {Object} Book
 * @property {number} id - Уникальный идентификатор книги.
 * @property {string} title - наименование книги.
 * @property {string} description - описание книги.
 * @property {boolean} available - Статус доступности книги.
 * @property {Date} created_at - дата и время создания книги.
 * @property {Date} updated_at - дата и время последнего обновления.
 */

type Book = {
  id: number;
  title: string;
  description: string;
  available: boolean;
  created_at: Date;
  updated_at: Date;
};

/**
 * Получает все книги из базы данных.
 * 
 * @async
 * @function getAll
 * @returns {Promise<Book[]>} Массив всех книг.
 * @throws {Error} Если произошла ошибка при выполнении SQL-запроса.
 */

async function getAll() {
  const query: string = 'SELECT * FROM books';
  const result = await pool.query(query);

  return result.rows as Book[]; // used 'as' becouse we have clear PG
};


/**
 * Получает все книги с их авторами из базы данных.
 *
 * @async
 * @function getAllWithAuthors
 * @returns {Promise<Book[]>} Массив всех книг с их авторами.
 * @throws {Error} Если произошла ошибка при выполнении SQL-запроса.
 */

async function getAllWithAuthors() {
  const query: string = `
      SELECT 
        b.id AS book_id,
        b.title,
        b.description,
        json_agg(
          DISTINCT jsonb_build_object(
            'id', a.id,
            'name', a.name,
            'bio', a.bio
          )
        ) FILTER (WHERE a.id IS NOT NULL) AS authors
      FROM books b
      LEFT JOIN books_authors ba ON b.id = ba.book_id
      LEFT JOIN authors a ON ba.author_id = a.id
      GROUP BY b.id;
    `;
  const result = await pool.query(query);

  return result.rows as Book [];
}


/**
 * Получает одну запись о займе книги по её ID.
 *
 * @async
 * @function getOneById
 * @param {number} bookId - Уникальный идентификатор книги.
 * @returns {Promise<Book[]>} Объект с информацией о названии книги.
 * @throws {Error} Если запись с таким ID не найдена или произошла ошибка в запросе.
 */
async function getOneById(bookId: any) {
  const query: string = 'SELECT * FROM books WHERE id = $1;';
  const value = [bookId];

  const result = await pool.query(query, value);
  console.log({ result });

  return result.rows[0] as Book;
}


/**
 * Получает одну книгу с ее автором по ID книги.
 *
 * @async
 * @function getOneWithAuthorById
 * @param {number} bookId - Уникальный идентификатор книги.
 * @returns  {Promise<Book|null>} - Возвращает объект книги или null, если не найден.
 * @throws {Error} Если запись с таким ID не найдена или произошла ошибка в запросе.
 */

async function getOneWithAuthorById(bookId: any) {
  const query: string = `
    SELECT 
      b.id AS book_id,
      b.title,
      b.description,
      json_agg(
        json_build_object(
          'id', a.id,
          'name', a.name,
          'bio', a.bio
        )
      ) AS authors
    FROM books b
    JOIN books_authors ba ON b.id = ba.book_id
    JOIN authors a ON ba.author_id = a.id
    WHERE b.id = $1
    GROUP BY b.id;
  `;
  const result = await pool.query(query, [bookId]);
  return result.rows[0] as Book;
}


/**
 * Создает одну книгу.
 *
 * @async
 * @function create
 * @param {text} bookTitle - название книги.
 * @param {text} bookDescription - описание книги
 * @param {boolean} bookAvailable - наличие книги по умоляания true.
 * @returns {Promise<Book|null>} - Возвращает объект книги или null, если не найден.
 * @throws {Error} Если произошла ошибка при создании книги.
 */

async function create(bookTitle: string, bookDescription: string, bookAvailable: boolean = true) {
  console.log({ bookTitle, bookDescription, bookAvailable });
  const query = 'INSERT INTO books (title, description, available) values ($1, $2, $3) RETURNING * ;';
  const values = [bookTitle, bookDescription, bookAvailable];

  const result = await pool.query(query, values);
  console.log({ result });

  return result.rows[0] as Book;
}


/**
 * Удаляет одну книгу по ID.
 *
 * @async
 * @function remove
 * @param {number} bookId - ID книги.
 * @returns {Promise<Book|null>} Объект удалённой книги или null, если не найдена.
 * @throws {Error} Если произошла ошибка при создании книги.
 */

async function remove(bookId: number) {
  const query = 'DELETE FROM books WHERE id = $1  RETURNING *';
  const values = [bookId];
  const result = await pool.query(query, values);

  return result.rows[0] as Book;
}


/**
 * Обнавляет статус наличия книги по ID.
 *
 * @async
 * @function updateStatus
 * @param {number} book_id - ID книги.
 * @param {boolean} isAvailable - статус наличия книги.
 * @returns {Promise<Book|null>} Обновлённая книга или null, если книга не найдена.
 * @throws {Error} Если произошла ошибка при создании книги.
 */

async function updateStatus(book_id: number, isAvailable: boolean) {
  const query: string = `
  UPDATE books
    SET available = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *;
    `;
  const values = [book_id, isAvailable];
  try {
    const result = await pool.query(query, values);
    if (result.rows.length === 0) {
      console.warn(`Book with ID ${book_id} not found`);
      return null;
    }
    
    return result.rows[0] as Book;
  } catch (err) {
    console.error('Error updating book status:', err);
    throw err;
  }
}


export {
  getAll,
  getAllWithAuthors,
  getOneById,
  getOneWithAuthorById,
  create,
  remove,
  updateStatus,
};
