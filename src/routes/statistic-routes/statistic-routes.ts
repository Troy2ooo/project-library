"use strict"; 
import express from 'express'
import { getAllDebtors, getOneDebtor, getAllUnavailableService, getAllAvailableService, getTopUsers 
} from '../../services/statistic-service/statistic-service'

const router = express.Router();

router.get('/debtors', getAllDebtors);
router.get('/debtors/:username', getOneDebtor);
router.get('/books/unavailable', getAllUnavailableService);
router.get('/books/available', getAllAvailableService);
router.get('/top-users', getTopUsers);


export default router;