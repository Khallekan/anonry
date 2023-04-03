import cookieParser from 'cookie-parser';
// import passport from "passport";
import cookieSession from 'cookie-session';
import cors from 'cors';
import express, { Express, Request, Response } from 'express';
import ExpressMongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import { StatusCodes } from 'http-status-codes';
import logger from 'morgan';
import path from 'path';
import serveFavicon from 'serve-favicon';
import xss from 'xss-clean';

import { globalErrorHandle } from './errorService/controllers/errorController';
import AppError from './errorService/utils/AppErrorModule';
import mainRoutes from './main-routes';

const app: Express = express();
app.use(cors());

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable('trust proxy');
app.set('view engine', 'pug');

app.options('*', cors());

app.get('/', (req: Request, res: Response) => {
  res.status(StatusCodes.OK).send('Welcome to Anonry');
});

app.use('/', mainRoutes);

app.use(serveFavicon(path.join(__dirname, '../public', 'favicon.png')));
app.set('views', path.join(__dirname, '../emailViews'));

app.use(helmet());

app.use(ExpressMongoSanitize());
app.use(xss());

// setting up cookieSession
app.use(
  cookieSession({
    maxAge: 24 * 60 * 60 * 1000,
    keys: [`${process.env.COOKIE_SECRET_KEY}`],
  })
);

// app.use(passport.initialize());
// app.use(passport.session());

app.all('*', (req, _res, next) => {
  // we create an error by initializing the Error class object
  //whenever we pass an argument into next() express always sees it as an error message, it will then skip all the other middlware/functions to be executed and pass the error to the global error handler making that error acessible to our default express error middleware
  next(
    new AppError(
      `Can't find ${req.originalUrl} on this server!! 😫`,
      StatusCodes.NOT_IMPLEMENTED
    )
  );
});

app.use(globalErrorHandle);

export default app;
