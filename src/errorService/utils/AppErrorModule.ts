export default class AppError extends Error {
  statusCode: string | number;
  status: string;
  isOperational: boolean;
  constructor(message: string, statusCode: string | number) {
    // initiate the parent's class contructor with super
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    console.log(this.statusCode, this.status);
    //we mostly use this error class for operational errors, errors from using the api not bugs from the api code, e.g network problem

    this.isOperational = true;

    // we also wanna capture the error stacktrace
    Error.captureStackTrace(this, this.constructor);
  }
}

// module.exports = AppError;
