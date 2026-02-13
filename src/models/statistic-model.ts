import { Result } from 'pg';
import {pool} from '../../db';
import { error, log } from 'console';

/**
 * @module StatisticModule
 * Модуль для работы с таблицами: users, book_loans, books в базе данных.
 * 
 * Содержит функции для:
 * - получение должников у которых есть не сданные книги с названиями книг и датой когда взял ,
 * - получение одного должника по имени,
 * - получение не сданных книг с датой когдв взяли и кто взял, 
 * - получение всех доступных книг, 
 * - получение топ 5 самых актвных пользователей.
 */

type Debtor = {
    user_id: number;
    username: string;
    email: string;
    title: string;
    taken_at: Date;
  };


async function getAllDeb( ) {
    try {
    const query: string =    
    'SELECT bl.user_id, u.username, u.email, b.title, bl.taken_at FROM book_loans bl JOIN users u ON u.id = bl.user_id JOIN books b ON b.id = bl.book_id WHERE bl.returned_at IS NULL';
    const result = await pool.query(query); 

    return result.rows as Debtor [];

    } catch (error) {
        console.error("Error fetching all debtor:", error);
        throw error
    }
};

async function getOneByName(username: string): Promise<Debtor | null> {
    if (!username) {
        throw new Error ("Username is required"); 
    }
    const query: string = 'SELECT u.username, u.email, b.title, bl.taken_at FROM book_loans bl JOIN users u ON u.id = bl.user_id JOIN books b ON b.id = bl.book_id WHERE u.username = $1 AND bl.returned_at IS NULL'; 
    const value = [ username ];
    
    try {
    const result = await pool.query(query, value);
    if (result.rowCount === 0) {
    return null;
      }

    return result.rows[0] as Debtor

    } catch (error: any) {
    console.error("Ups. somthing wrong", error);
    throw error
    }
};


async function getAllUnavailable( ) {
    try {
  const query: string = 'SELECT u.id, u.username, u.email, bl.taken_at, b.title FROM book_loans bl JOIN users u ON u.id = bl.user_id JOIN books b ON b.id = bl.book_id WHERE bl.returned_at IS NULL';
  const result = await pool.query(query);

  return result.rows;

    } catch (error:any) {
        console.error('Error fetching unavailable books:', error);
        throw error;
    }
};


async function getAllAvailable ( ) {
    try {
  const query: string = 'SELECT * FROM books WHERE available = true';
  const result = await pool.query(query);

  return result.rows;
    }
    catch (error) {
        console.error('Error fetching available books:', error);
        throw error
    }
};


 async function getTop( ) {
    try {
    const query: string = 'SELECT u.id AS user_id, u.username, COUNT(bl.book_id) AS books_taken FROM users u JOIN book_loans bl ON bl.user_id = u.id GROUP BY u.id, u.username ORDER BY books_taken DESC LIMIT 5;'
    const result = await pool.query(query);
    return result.rows;
}
catch (error) {
    console.error('Error fetching top users:', error);
    throw error;
} 
 };


 export { getAllDeb, getOneByName, getAllUnavailable, getAllAvailable, getTop }