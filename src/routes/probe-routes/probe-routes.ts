"use strict";
import express  from "express";

import {getHello} from '../../services/probe-service/get-hello';
import {getTime} from '../../services/probe-service/get-time-for-db';

const router = express.Router();

router.get('/', getHello);
router.get('/db', getTime);

export default router;
