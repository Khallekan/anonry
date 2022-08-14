import { NextFunction, Request, Response } from "express";
import Entry from "../../entries/model/entriesModel";
import { StatusCodes } from "http-status-codes";
import ResponseStatus from "../../utils/response";
import catchController from "../../utils/catchControllerAsyncs";
import createPageInfo from "../../utils/createPagination";
import Likes from "../../likes/model/likesModel";

const resp = new ResponseStatus();

export const getTimeline = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    let sort: string, limit: number, page: number, totalDocuments: number;

    // If page and limit are of invalid types return error
    if (req.query.page && typeof req.query.page != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid page number" });
    }
    if (req.query.limit && typeof req.query.limit != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid limit number" });
    }
    if (req.query.sort && typeof req.query.sort != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sort value" });
    }

    limit = req.query.limit ? parseInt(req.query.limit) : 20;
    page = req.query.page ? parseInt(req.query.page) : 1;
    sort = req.query.sort ? req.query.sort.split(",").join(" ") : "createdAt";

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    // define the type of the search object
    interface ISearchBy {
      deleted: boolean;
      published: boolean;
    }

    // define parameters to search by
    const searchBy: ISearchBy = {
      deleted: false,
      published: true,
    };

    let entries = await Entry.find(searchBy)
      .limit(limit)
      .skip(startIndex)
      .sort(sort);

    entries = await Promise.all(
      entries.map((entry) => {
        
        // check if the user_id is in the liked_by array
        const liked_by = entry.liked_by.find((user) => user.toString() === user_id);
        
        if (liked_by) {
          entry.isLiked = true;
        } else {
          entry.isLiked = false;
        }

        console.log(entry.isLiked);

        return entry;
      })
    );

    console.log(entries);
    

    totalDocuments = await Entry.countDocuments(searchBy);

    const pageInfo = createPageInfo({
      page,
      limit,
      startIndex,
      totalDocuments,
    });

    resp
      .setSuccess(
        StatusCodes.OK,
        { entries, pageInfo },
        "Timeline fetched successfully"
      )
      .send(res);
  }
);
