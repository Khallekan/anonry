import express, { Express, Request, Response } from "express";
import logger from "morgan";
import helmet from "helmet";
import { globalErrorHandle } from "./errorService/controllers/errorController";
import AppError from "./errorService/utils/AppErrorModule";
import ExpressMongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import cors from "cors";

const app: Express = express();
app.use(cors());

app.use(logger("dev"));
app.use(helmet());
app.use(xss());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.options("*", (cors as any)());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.all("*", (req, res, next) => {
  // we create an error by initializing the Error class object

  //whenever we pass an argument into next() express always sees it as an error message, it will then skip all the other middlware/functions to be executed and pass the error to the global error handler making that error acessible to our default express error middleware

  next(new AppError(`Can't find ${req.originalUrl}  on this server!! 😫`, 404));
});

app.use(ExpressMongoSanitize());

app.use(globalErrorHandle);

export default app;
