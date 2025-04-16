import {Request, Response, NextFunction} from 'express';

export function isAuth(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
        return res.redirect('/log-in');
    }

    next();
}