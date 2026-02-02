"use strict";

import { Request, Response } from "express";

/**
 *
 * @param req
 * @param res
 */
export function getHello(req: Request, res: Response): void {
    res.status(200)
    res.setHeader("cusom", 'its-me')
    res.send('Hello World');
};
