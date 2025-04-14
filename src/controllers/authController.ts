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