import Tag from "../model/tagsModel";
import { StatusCodes } from "http-status-codes";
import { NextFunction, Request, Response } from "express";
import ResponseStatus from "../../utils/response";
import catchController from "../../utils/catchControllerAsyncs";


const resp = new ResponseStatus();

export const getAllTags = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const tags = await Tag.find().sort("name");
    return resp
      .setSuccess(StatusCodes.OK, tags, "Tags fetched successfully")
      .send(res);
  }
);

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
