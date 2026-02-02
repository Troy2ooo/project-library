"use strict";
import express from "express";
import { getAllAuthors, getAuthor, createAuthor, deleteAuthor
} from '../../services/authors-service/authors-service'

const router = express.Router();

router.get('/', getAllAuthors);
router.get('/:id', getAuthor);
router.post('/', createAuthor);
router.delete('/:id', deleteAuthor);

export default router;