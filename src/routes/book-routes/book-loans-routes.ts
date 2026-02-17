"use strict";
import express from "express";
import {
    getAllLoans, 
    getLoan, 
    checkoutBook, 
    returnBook 
} from   '../../services/books-service/books-loans-service';

const { authenticateToken } = require('../../middleware/auth-middleware'); // how here?

const router = express.Router();

router.get('/', getAllLoans);
router.get('/:id', getLoan);
router.post('/:id/checkout', authenticateToken, checkoutBook); 
router.post('/:id/return', authenticateToken, returnBook);

export default router;
