import catchController from "../../utils/catchControllerAsyncs";
import Entry from "../../entries/model/entriesModel";
import Likes from "../model/likesModel";
import User from "../../users/model/userModel";
import ResponseStatus from "../../utils/response";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
const resp = new ResponseStatus();

export const handleLikes = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const liked_by = req.user._id;

    const entry_id: undefined | string = req.body.entry_id;
    const action: "like" | "unlike" | undefined = req.body.action;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    if (!action || !["like", "unlike"].includes(action)) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Action is required")
        .send(res);
    }

    let entry = await Entry.findOne({ _id: entry_id, deleted: false });

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Invalid Id").send(res);
    }

    if (!entry.published) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Cannot like an unpubilished entry")
        .send(res);
    }

    if (action === "unlike") {
      if (!entry.liked_by?.includes(liked_by)) {
        return resp
          .setError(StatusCodes.BAD_REQUEST, "Entry is not liked")
          .send(res);
      }
      // reduce no of likes of entry by 1 and remove user id from the liked_by array in the entry
      entry.no_of_likes -= 1;
      entry.liked_by = entry.liked_by?.filter(
        (user) => user.toString() !== liked_by.toString()
      );
      await entry.save();

      // delete the like from the likes collection
      await Likes.findOneAndDelete({ entry_id, liked_by });

      // reduce the no of likes of the user by 1
      await User.findByIdAndUpdate(
        entry.user._id,
        { $inc: { no_of_likes: -1 } },
        { new: true }
      );

      entry.isLiked = false;

      return resp
        .setSuccess(StatusCodes.OK, entry, "Entry unliked successfully")
        .send(res);
    }

    if (action === "like") {
      if (entry.liked_by?.includes(liked_by)) {
        return resp
          .setError(StatusCodes.BAD_REQUEST, "Entry already liked")
          .send(res);
      }
      // if the entry is not liked by the user, then add the like to the likes collection
      await Likes.create({
        entry: entry_id,
        liked_by,
        owner: entry.user._id,
      });

      // add the user id to the liked_by array in the entry
      await Entry.findByIdAndUpdate(
        entry_id,
        { $push: { liked_by: liked_by }, $inc: { no_of_likes: 1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        entry.user._id,
        { $inc: { no_of_likes: 1 } },
        { new: true }
      );

      entry.isLiked = true;

      return resp
        .setSuccess(StatusCodes.OK, entry, "Entry liked successfully")
        .send(res);
    }
  }
);
