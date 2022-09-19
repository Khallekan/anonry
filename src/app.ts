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
import { StatusCodes } from "http-status-codes";
import passport from "passport";
import cookieSession from "cookie-session";

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
  res.send("Welcome to Anonry");
});

app.use("/", mainRoutes);

app.set("views", path.join(__dirname, "../emailViews"));

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


app.use(passport.initialize());
app.use(passport.session());

app.all("*", (req, res, next) => {
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
