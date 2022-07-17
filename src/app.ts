import express, { Express, Request, Response } from "express";
import logger from "morgan";
import helmet from "helmet";
import { globalErrorHandle } from "./errorService/controllers/errorController";
import AppError from "./errorService/utils/AppErrorModule";
import ExpressMongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import cookieParser from "cookie-parser";
import cors from "cors";
import mainRoutes from "./main-routes";
import path from "path";

const app: Express = express();
app.use(cors());

app.use(logger("dev"));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.enable("trust proxy");
app.set("view engine", "pug");


app.options("*", (cors as any)());

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.use("/", mainRoutes);

app.set("views", path.join(__dirname, "../emailViews"));


app.use(helmet());

app.use(ExpressMongoSanitize());

app.use(xss());

app.all("*", (req, res, next) => {
  // we create an error by initializing the Error class object

  //whenever we pass an argument into next() express always sees it as an error message, it will then skip all the other middlware/functions to be executed and pass the error to the global error handler making that error acessible to our default express error middleware

  next(new AppError(`Can't find ${req.originalUrl} on this server!! 😫`, 404));
});

app.use(globalErrorHandle);

export default app;
