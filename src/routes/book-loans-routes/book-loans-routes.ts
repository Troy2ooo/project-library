import express  from 'express';
import { getAllLoans, getLoan, checkoutBook, returnBook }
from  '../../services/books-service/books-loans-service';

const router = express.Router();

router.get('/', getAllLoans);
router.get('/:id', getLoan);


import { authenticateToken } from '../../middleware/auth-middleware';


router.post('/checkout/:id', authenticateToken, checkoutBook);
router.post('/return/:id', authenticateToken, returnBook);




export default router;
