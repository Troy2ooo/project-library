import {pool} from '../../db'

/**
 * @module BookLoansModel
 * 
 * Модуль для работы с таблицей `book_loans` в базе данных.
 * 
 * Содержит функции для:
 * - получения всех записей о займах книг,
 * - получения одного займа по ID,
 * - регистрации выдачи книги пользователю,
 * - регистрации возврата книги.
 */


/**
 * пользовательский тип, описывающий свойства объекта, который содержит данные о записях займов книг.
 * 
 * @typedef {Object} BookLoan
 * @property {number} id - Уникальный идентификатор займа.
 * @property {number} book_id - ID книги.
 * @property {number} user_id - ID пользователя, который взял книгу.
 * @property {Date} taken_at - Дата и время, когда книга была взята.
 * @property {Date|null} returned_at - Дата и время возврата книги (если книга возвращена).
 */
 
type Loan = {
  book_id: number;
  user_id: number;
  taken_at: Date;
  returned_at: Date;
}

/**
 * Получает все записи о займах книг из базы данных.
 *
 * @async
 * @function getAll
 * @returns {Promise<BookLoan[]>} Массив всех записей о займах.
 * @throws {Error} Если произошла ошибка при выполнении SQL-запроса.
 */

async function getAll() {
  const query: string = 'SELECT * FROM book_loans';
  const result = await pool.query(query);

  return result.rows as Loan [];
}


/**
 * Получает одну запись о займе книги по её ID.
 *
 * @async
 * @function getOneLoanById
 * @param {number} loanId - Уникальный идентификатор записи займа.
 * @returns {Promise<BookLoan>} Объект с информацией о займе.
 * @throws {Error} Если запись с таким ID не найдена или произошла ошибка в запросе.
 */

async function getOneLoanById(loanId: number) {
  const query: string = 'SELECT * FROM book_loans WHERE id = $1;';
  const value = [loanId];
  const result = await pool.query(query, value);

  return result.rows[0] as Loan;
}


/**
 * Регистрирует выдачу книги пользователю (создаёт новую запись о займе).
 *
 * @async
 * @function checkoutBook
 * @param {number} bookId - ID книги, которую берут.
 * @param {number} userId - ID пользователя, который берёт книгу.
 * @returns {Promise<BookLoan>} Объект с данными о созданной записи займа.
 * @throws {Error} Если произошла ошибка при добавлении записи.
 */

async function checkoutBook(bookId: number, userId: number) {
  const query: string = `
    INSERT INTO book_loans (book_id, user_id, taken_at)
    VALUES ($1, $2, NOW())
    RETURNING *;
  `;
  const values = [bookId, userId];
  const result = await pool.query(query, values);

  return result.rows[0] as Loan;
}


/**
 * Регистрирует возврат книги пользователем (обновляет запись займа).
 *
 * @async
 * @function turnBackBook
 * @param {number} bookId - ID книги, которую возвращают.
 * @param {number} userId - ID пользователя, который возвращает книгу.
 * @returns {Promise<BookLoan>} Обновлённая запись займа с датой возврата.
 * @throws {Error} Если запись не найдена или книга уже была возвращена.
 */

async function turnBackBook(bookId: number, userId: number) {
  const query: string = `
    UPDATE book_loans
    SET returned_at = NOW()
    WHERE book_id = $1 AND user_id = $2 AND returned_at IS NULL
    RETURNING *;
  `;
  const values = [bookId, userId];
  const result = await pool.query(query, values);

  return result.rows[0] as Loan;
}

export { getAll, getOneLoanById, checkoutBook, turnBackBook };
