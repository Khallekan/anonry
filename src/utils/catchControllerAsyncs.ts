import { NextFunction, Request, Response } from 'express';

const catchController = (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<Response<unknown, Record<string, unknown>>> | unknown
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: unknown) {
      console.log(err);
      return next(err);
    }
  };
};

export default catchController;
