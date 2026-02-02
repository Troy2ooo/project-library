"use strict";
import express from "express";
import { 
    registerUser, 
    loginUser, 
    getProfile, 
    refreshAccessToken,
    } from '../../services/auth-service/auth-service'; 
import { authenticateToken }from '../../middleware/auth-middleware';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', authenticateToken, getProfile);
router.post('/refresh', refreshAccessToken)

export default router;