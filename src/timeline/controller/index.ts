import { NextFunction, Request, Response } from "express";
import { catchController } from "../../utils";

export const getTimeline = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    res.json({
      message: "Hello World",
    });
  }
);
