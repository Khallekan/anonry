import { Request, Response, NextFunction } from "express";

export default (
  fn: (
    req: Request,
    res: Response,
    next: NextFunction
  ) => Promise<Response<any, Record<string, any>>> | any
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await fn(req, res, next);
    } catch (err: any) {
      console.log(err);
      // res.status(500).json({ success: false, message: err.message });
      return next(err);
    }
  };
};
