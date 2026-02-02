import { Request, Response } from "express";
import {pool} from'../../../db';
import router from '../../routes/auth-routes/auth-routes';

// pool - это объект, который позволяет приложению управлять несколькими соединениями с базой данных

/**
 *
 * @param req  
 * @param res
 */
async function getTime(req: Request, res: Response) {
  pool.query('SELECT NOW()', (err: any, result: any) => {
    if (err) {
      return res.status(500).send(err.toString());
    }
    res.send(result.rows);
  });
};

export { getTime }
