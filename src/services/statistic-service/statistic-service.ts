import { Request, Response } from 'express';
import { 
    getAllDeb, 
    getOneByName, 
    getAllUnavailable, 
    getAllAvailable, 
    getTop } from '../../models/statistic-model' 

    /**
 * @module StatisticService
 * Сервисный модуль для работы со статистикой.
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
    

async function getAllDebtors(req: Request, res: Response): Promise<void> {
    try {
      const debtors = await getAllDeb();
  
      res.json({
        message: 'List of all debtors',
        data: debtors,
      });
  
    } catch (error: any) {
      res.status(500).json({
        message: 'Error getting debtors',
        error: error.message,
      });
    }
  };


  async function getOneDebtor(req: Request, res: Response): Promise<void> {
    try {
      const { username } = req.params;
  
      const debtor = await getOneByName(username);
  
      if (!debtor) {
        res.status(404).json({
          message: 'User not found or no active loans',
        });
        return;
      }
  
      res.json({
        message: 'Debtor found',
        data: debtor,
      });
  
    } catch (error: any) {
      res.status(500).json({
        message: 'Error getting debtor',
        error: error.message,
      });
    }
  };


  async function getAllUnavailableService(req: Request, res: Response): Promise<void> {
    try {
      const data = await getAllUnavailable();
  
      res.json({
        message: 'All unavailable books',
        data,
      });
  
    } catch (error: any) {
      res.status(500).json({
        message: 'Error getting unavailable books',
        error: error.message,
      });
    }
  };


  async function getAllAvailableService(req: Request, res: Response): Promise<void> {
    try {
      const data = await getAllAvailable();
  
      res.json({
        message: 'All available books',
        data,
      });
  
    } catch (error: any) {
      res.status(500).json({
        message: 'Error getting available books',
        error: error.message,
      });
    }
  };


  async function getTopUsers(req: Request, res: Response): Promise<void> {
    try {
      const topUsers = await getTop();
  
      res.json({
        message: 'Top 5 active users',
        data: topUsers,
      });
  
    } catch (error: any) {
      res.status(500).json({
        message: 'Error getting top users',
        error: error.message,
      });
    }
  };
  

    export { getAllDebtors, getOneDebtor, getAllUnavailableService, getAllAvailableService, getTopUsers }
  
  
  
  