"use strict";
import express from "express";
import { 
    getAllBooks,
    getAllBooksWithAuthors,
    getBookById,
    getBookWithAuthor,
    createBook,
    deleteBook, 
} from '../../services/books-service/books-service';

const router = express.Router();

router.get('/with-authors', getAllBooksWithAuthors);
router.get('/with-authors/:id', getBookWithAuthor);
router.get('/', getAllBooks);
router.get('/:id', getBookById);
router.post('/', createBook);
router.delete('/:id', deleteBook);

export default router;
