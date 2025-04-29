import 'dotenv/config';
import express, { ErrorRequestHandler } from 'express';
import path from 'path';
import session from 'express-session';
import { PrismaSessionStore } from '@quixo3/prisma-session-store';
import passport from 'passport';
import  { PrismaClient } from '@prisma/client';
import authRouter from './routes/authRouter.js';
import folderRouter from './routes/folderRouter.js';
import { isAuth } from './middleware/index.js';
import fileRouter from './routes/fileRouter.js';

const __dirname = path.resolve();
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, 'public')));
app.use(
    session({
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000 // ms
        },
        secret: process.env.COOKIE_SECRET!,
        resave: true,
        saveUninitialized: true,
        store: new PrismaSessionStore(
            new PrismaClient(),
            {
                checkPeriod: 2 * 60 * 1000,
                dbRecordIdIsSessionId: true,
                dbRecordIdFunction: undefined
            }
        )
    })
);
app.use(passport.session());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

app.use('/', authRouter);

app.use(isAuth);
app.get('/', (req, res) => {
    res.redirect('/folders');
})
app.use('/folders', folderRouter);
app.use('/files', fileRouter);
app.use('/{*any}', (req, res) => {
    res.render('error', {
        status: 404,
        message: 'Sorry, we couldn\'t find the page you\'re looking for.'
    });
});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    return console.log(`Express is listening at http://localhost:${port}`);
});


// Error Handling
app.use(((err, req, res, next) => {
    const status = err.status || 500;
    res.status(status).render('error', { 
        status,
        message: err.message 
    });
  }) as ErrorRequestHandler);