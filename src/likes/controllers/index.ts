import catchController from "../../utils/catchControllerAsyncs";
import Entry from "../../entries/model/entriesModel";
import Likes from "../model/likesModel";
import User from "../../users/model/userModel";
import ResponseStatus from "../../utils/response";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ObjectId } from "mongodb";
const resp = new ResponseStatus();

const handleLikes = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const liked_by = req.user._id;

    const entry_id: undefined | string = req.body.entry_id;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    const entry = await Entry.findOne({ _id: entry_id, deleted: false });

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Invalid Id").send(res);
    }

    if (!entry.published) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Cannot like an unpubilished entry")
        .send(res);
    }

    const isLiked = await Likes.findOne({
      entry: entry_id,
      liked_by: liked_by,
    });

    if (isLiked) {
      // reduce no of likes of entry by 1 and remove user id from the liked_by array in the entry
      const updatedEntry = await Entry.findByIdAndUpdate(
        entry_id,
        {
          $inc: { no_of_likes: -1 },
          $pull: { liked_by: new ObjectId(liked_by) },
        },
        { new: true }
      ).select("-liked_by");

      if (!updatedEntry) {
        return resp
          .setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating entry")
          .send(res);
      }

      // delete the like from the likes collection
      await Likes.findByIdAndDelete(isLiked._id);

      // reduce the no of likes of the user by 1
      await User.findByIdAndUpdate(
        isLiked.owner,
        { $inc: { no_of_likes: -1 } },
        { new: true }
      );

      updatedEntry.isLiked = false;

      return resp
        .setSuccess(
          StatusCodes.OK,
          [updatedEntry],
          "Entry unliked successfully"
        )
        .send(res);
    }

    // if the entry is not liked by the user, then add the like to the likes collection
    const like = await Likes.create({
      entry: entry_id,
      liked_by,
      owner: entry.user._id,
    });

    // increase the no of likes of the entry by 1
    const updatedEntry = await Entry.findByIdAndUpdate(
      entry_id,
      { $inc: { no_of_likes: 1 } },
      { new: true }
    ).select("-liked_by");

    if (!updatedEntry) {
      //  delete the like from the likes collection
      await Likes.findByIdAndDelete(like._id);
      return resp
        .setError(StatusCodes.INTERNAL_SERVER_ERROR, "Error updating entry")
        .send(res);
    }

    // increase the no of likes of the user by 1
    await User.findByIdAndUpdate(
      entry.user._id,
      { $inc: { no_of_likes: 1 } },
      { new: true }
    );
    updatedEntry.isLiked = true;
    return resp
      .setSuccess(StatusCodes.OK, [updatedEntry], "Entry liked successfully")
      .send(res);
  }
);
