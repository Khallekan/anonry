import Trash from "../model/trashModel";
import catchController from "../../utils/catchControllerAsyncs";
import createPageInfo from "../../utils/createPagination";
import { Request, Response, NextFunction } from "express";
import ResponseStatus from "../../utils/response";
import { StatusCodes } from "http-status-codes";

const resp = new ResponseStatus();

export const getTrash = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    let sort: string,
      limit: number,
      page: number,
      totalDocuments: number,
      type: "entry" | "task" | undefined;

    // If page and limit are of invalid types return error
    if (req.query.page && typeof req.query.page != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Page must be a string")
        .send(res);
    }
    if (req.query.limit && typeof req.query.limit != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Limit must be a string")
        .send(res);
    }
    if (req.query.sort && typeof req.query.sort != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Sort must be a string")
        .send(res);
    }
    if (req.query.type && typeof req.query.type != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Type must either be entry or task")
        .send(res);
    }
    limit = req.query.limit ? parseInt(req.query.limit) : 20;
    page = req.query.page ? parseInt(req.query.page) : 1;
    sort = req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt";
    if (
      (req.query.type && req.query.type === "entry") ||
      req.query.type === "task"
    ) {
      type = req.query.type;
    }

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    // define the type of the search object
    interface ISearchBy {
      user: string;
      type?: "entry" | "task";
    }

    // define parameters to search by
    const searchBy: ISearchBy = {
      user: user_id,
    };

    if (type) {
      searchBy.type = type;
    }

    // count documents that match the searchBy
    totalDocuments = await Trash.countDocuments(searchBy);

    const pageInfo = createPageInfo({
      limit,
      page,
      startIndex,
      totalDocuments,
    });

    // find all the entries in the trash
    const trash = await Trash.find(searchBy)
      .sort(sort)
      .limit(limit)
      .skip(startIndex);

    resp
      .setSuccess(
        StatusCodes.OK,
        { trash, pageInfo },
        "Trash fetched successfully"
      )
      .send(res);
  }
);
