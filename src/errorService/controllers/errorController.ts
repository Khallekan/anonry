import { ErrorRequestHandler } from 'express';
import { StatusCodes } from 'http-status-codes';

import AppError from '../utils/AppErrorModule';

const handleCastErrorDB: ErrorRequestHandler = (err, _req, _res, _next) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleDuplicateFieldsDB: ErrorRequestHandler = (
  err,
  _req,
  _res,
  _next
) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];

  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleValidationErrorDB: ErrorRequestHandler = (
  err,
  _req,
  _res,
  _next
) => {
  console.log(`This is the error ${err}`);
  console.log({ err });

  // const errors = Object.values(err.errors).map((el: any) => el.message);

  const message = `IValidation Error: invalid input data.`;
  return new AppError(message, StatusCodes.BAD_REQUEST);
};

const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', StatusCodes.UNAUTHORIZED);

const handleJWTExpiredError = () =>
  new AppError(
    'Your token has expired! Please log in again.',
    StatusCodes.UNAUTHORIZED
  );

// const sendErrorDev = (err, req, res) => {
//   console.log(req.originalUrl);
//   // A) API
//   // if (req.originalUrl.startsWith('/anonry')) {
//   //   return res.status(err.statusCode).json({
//   // 	status: err.status,
//   // 	error: err,
//   // 	message: err.message,
//   // 	stack: err.stack
//   //   });
//   // }

//   // B) RENDERED WEBSITE
//   console.error('ERROR 💥', err);
//   return res.status(err.statusCode).json({
//     data: {
//       title: err.name,
//       message: err.message,
//       status: err.statusCode,
//     },
//   });
// };

const sendErrorProd: ErrorRequestHandler = (err, req, res, _next) => {
  // A) API
  if (req.originalUrl.startsWith('/')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        data: { status: err.statusCode, message: err.message },
      });
    }
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    console.error('ERROR 💥', err);
    // 2) Send generic message
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      data: {
        status: StatusCodes.INTERNAL_SERVER_ERROR,
        title: 'Something went very wrong!',
        message: err.message,
      },
    });
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      data: {
        title: 'Something went wrong!',
        message: err.message,
        status: err.statusCode,
      },
    });
  }
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  console.error('ERROR 💥', err);
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    data: {
      title: 'Something went wrong!',
      message: 'Please try again later.',
      status: err.statusCode,
    },
  });
};

export const globalErrorHandle: ErrorRequestHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  err.status = err.status || 'error';

  console.log({ status: err.status, statusCode: err.statusCode });
  // if (process.env.NODE_ENV === "development") {
  //   sendErrorProd(err, req, res);
  // } else if (process.env.NODE_ENV === "production") {
  // because we wanna use the old version of err
  let error = { ...err };
  error.message = err.message;
  if (err.name === 'CastError') {
    error = handleCastErrorDB(error, req, res, next);
  } else if (err.code === 11000) {
    error = handleDuplicateFieldsDB(error, req, res, next);
  } else if (err.name === 'ValidationError') {
    error = handleValidationErrorDB(error, req, res, next);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
    console.log('The error is', error);
  }

  sendErrorProd(error, req, res, next);
  // }
};

//   module.exports=globalErrorHandle;
