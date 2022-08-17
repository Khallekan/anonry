import { NextFunction, Request, Response } from "express";
import Entry from "../../entries/model/entriesModel";
import { StatusCodes } from "http-status-codes";
import ResponseStatus from "../../utils/response";
import catchController from "../../utils/catchControllerAsyncs";
import createPageInfo from "../../utils/createPagination";
import Likes from "../../likes/model/likesModel";
import Tags from "../../tags/model/tagsModel";

const resp = new ResponseStatus();

export const getTimeline = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    let sort: string,
      limit: number,
      page: number,
      totalDocuments: number,
      tags: string[];

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
    if (req.query.tags && typeof req.query.tags != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid tags value" });
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
      tags?: { $in: string[] };
    }

    // define parameters to search by
    const searchBy: ISearchBy = {
      deleted: false,
      published: true,
    };

    // if tags are provided, add them to the search object
    if (req.query.tags) {
      tags = req.query.tags.split(",");
      const tagsExist = await Tags.find({ name: { $in: tags } });
      if (tagsExist.length !== tags.length) {
        return resp
          .setError(StatusCodes.NOT_FOUND, "Some tags do not exist")
          .send(res);
      }
      searchBy.tags = { $in: tagsExist.map((tag) => tag._id) };
    }

    console.log({ location: "timeline", searchBy });

    totalDocuments = await Entry.countDocuments(searchBy);

    let entries = await Entry.find(searchBy)
      .limit(limit)
      .skip(startIndex)
      .sort(sort)
      .select("-__v");

    // entries = await Promise.all(
    //   entries.map(async (entry) => {
    //     // check if the user_id is in the liked_by array
    //     const liked_by = entry.liked_by?.find(
    //       (user) => user.toString() === user_id.toString()
    //     );
    //     console.log({ liked_by });

    //     if (liked_by) {
    //       entry.isLiked = true;
    //     } else {
    //       entry.isLiked = false;
    //     }

    //     // omit the liked_by array from the entry object
    //     entry.liked_by = undefined;
    //     return entry;
    //   })
    // );

    // check if entries are referenced in the likes collection
    // const likes = await Likes.find({ entry: { $in: await Promise.all(entries.map((entry) => entry._id)) } });
    const likes = await Likes.find({
      entry: { $in: entries.map((entry) => entry._id) },
      liked_by: user_id,
    });

    if (likes.length > 0) {
      likes.forEach((like) => {
        const entry = entries.find(
          (entry) => entry._id.toString() === like.entry._id.toString()
        );
        if (entry) {
          entry.isLiked = true;
        }
      });
    }

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
