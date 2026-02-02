"use strict";
import express from "express";
import {
    getAllUsers,
    getOneUser,
    createUser,
    deleteUser,
    updateUser,
    updateUserMail
} from '../../services/user-service/user-service';

const router = express.Router();

router.get('/', getAllUsers);
router.get('/:id', getOneUser);
router.post('/', createUser);
router.put('/:id', updateUser);
router.patch('/', updateUserMail);
router.delete('/:id', deleteUser);

export default router;
