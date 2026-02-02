import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config()

const pool = new Pool({
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 3000, 
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT) || 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Ошибка подключения к базе данных', err);
  } else {
    console.log('Успешное подключение к базе данных');
    release(); // Освобождаем клиента после использования
  }
});

console.log('Подключение к базе данных:', process.env.DB_NAME);


export {pool};
