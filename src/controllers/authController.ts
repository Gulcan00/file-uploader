import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { body, validationResult } from 'express-validator';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import prismaClient from '../prismaClient.js';
import { User } from '@prisma/client';

passport.use(new LocalStrategy((username, password, done) => {
    prismaClient.user.findUnique({
        where: {
            username
        }
    })
    .then(user => {
        if (!user) {
            return done(null, false, { message: 'Invalid username or password'});
        }

        bcrypt.compare(password, user.password)
        .then(match => {
            if (!match) {
                return done(null, false, { message: 'Invalid username or password'});
            }
            return done(null, user);
        })
        .catch(err => done(err));
    })
    .catch(err => done(err));
}));


passport.serializeUser((user, done) => {
    done(null, (user as User).id);
});

passport.deserializeUser((id: number, done) => {
    prismaClient.user.findUnique({
        where: {
            id
        }
    })
    .then(user => done(null, user))
    .catch(err => done(err));
});

export function signUpGet(req: Request, res: Response) {
    res.render('sign-up');
}

export const signUpPost = [
    body('username').trim().not().isEmpty().withMessage('Username is required'),
    body('password').trim().isStrongPassword().withMessage('Password must be 8 or more characters and contain 1 lower case letter, 1 upper case letter, 1 number and 1 symbol'),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        const { username, password } = req.body;

        if (!errors.isEmpty()) {
            return res.render('sign-up', {
                username,
                errors: errors.mapped()
            });
        }

        prismaClient.user.findUnique({
            where: {
                username
            }
        })
        .then(async user => {
            if (user) {
                return res.render('sign-up', {
                    username,
                    errors: { username: { msg: `Username already taken`}}
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            prismaClient.user.create({
                data: {
                    username,
                    password: hashedPassword,
                }
            })
            .then(() => res.redirect('/log-in'))
            .catch(next)
        })
        .catch(next)
    }
];

export function logInGet(req: Request, res: Response) {
    return res.render('log-in');
}

export const logInPost = [
    body('username').trim().not().isEmpty().withMessage('Username is required'),
    async (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        const { username, password } = req.body;

        if (!errors.isEmpty()) {
            return res.render('log-in', {
                username,
                errors: errors.mapped()
            });
        }

        return next();
    },
    passport.authenticate('local', {
        failureRedirect: '/log-in',
        successRedirect: '/'
    })
]