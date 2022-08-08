import { Request } from "common/types";
import { ResponseStatus, catchController, createPageInfo } from "utils";
import { NextFunction, Response } from "express";
import Entry from "entries/model/entriesModel";
import Bookmark from "bookmarks/model/bookmarkModel";
import { StatusCodes } from "http-status-codes";

const resp = new ResponseStatus();

export const createBookmark = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    const entry_id: string | undefined = req.body.entry_id;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    const entry = await Entry.findById(entry_id);
    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    // check if the entry is already bookmarked
    const isBookMarked = await Bookmark.findOne({
      entry: entry_id,
      bookmarked_by: user_id,
    });

    if (isBookMarked) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry already bookmarked")
        .send(res);
    }

    const bookmark = await Bookmark.create({
      bookmarked_by: user_id,
      entry: entry_id,
      tags: entry.tags,
      published_by: entry.user._id,
    });

    return resp
      .setSuccess(StatusCodes.OK, bookmark, "Bookmark created successfully")
      .send(res);
  }
);

// export const getBookmarks = catchController(
//   async (req: Request, res: Response, next: NextFunction) => {
    
//   })