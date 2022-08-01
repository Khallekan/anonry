import Tag from "../model";
import catchController from "../../utils/catchControllerAsyncs";
import ResponseStatus from "../../utils/response";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";

const resp = new ResponseStatus();

export const createTag = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const tag: string | undefined = req.body.tag;
    if (!tag) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Tag is required")
        .send(res);
    }

    const newTag = await Tag.create({
      name: tag,
    });

    return resp
      .setSuccess(StatusCodes.OK, newTag, "Tag created successfully")
      .send(res);
  }
);
