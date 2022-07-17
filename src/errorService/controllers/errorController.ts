import AppError from "../utils/AppErrorModule.js";
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  console.log(`This is the error ${err}`);
  const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `IValidation Error: invalid input data.`;
  return new AppError(message, 400);
};

const handleJWTError = () =>
  new AppError("Invalid token. Please log in again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please log in again.", 401);

const sendErrorDev = (err, req, res) => {
  console.log(req.originalUrl);
  // A) API
  // if (req.originalUrl.startsWith('/thrindle')) {
  //   return res.status(err.statusCode).json({
  // 	status: err.status,
  // 	error: err,
  // 	message: err.message,
  // 	stack: err.stack
  //   });
  // }

  // B) RENDERED WEBSITE
  console.error("ERROR 💥", err);
  return res.status(err.statusCode).json({
    title: err.name,
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith("/")) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error("ERROR 💥", err);
    // 2) Send generic message
    return res.status(500).json({
      status: "error",
      title: "Something went very wrong!",
      message: err.message,
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render("error", {
      title: "Something went wrong!",
      msg: err.message,
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error("ERROR 💥", err);
  // 2) Send generic message
  return res.status(err.statusCode).render("error", {
    title: "Something went wrong!",
    msg: "Please try again later.",
  });
};

export const globalErrorHandle = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log(err.statusCode, "statusCode");
  console.log(err.status, "status");

  // if (process.env.NODE_ENV === "development") {
  //   sendErrorProd(err, req, res);
  // } else if (process.env.NODE_ENV === "production") {
  // because we wanna use the old version of err
  let error = { ...err };
  error.message = err.message;
  if (err.name === "CastError") {
    error = handleCastErrorDB(error);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(error);
  } else if (err.name === "ValidationError") {
    error = handleValidationErrorDB(error);
  } else if (err.name === "JsonWebTokenError") {
    error = handleJWTError();
  } else if (err.name === "TokenExpiredError") {
    error = handleJWTExpiredError();
    console.log("The error is", error);
  }

  sendErrorProd(error, req, res);
  // }
};

//   module.exports=globalErrorHandle;
