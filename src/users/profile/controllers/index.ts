import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { IUser } from "../../../common/types";
import Entry from "../../../entries/model/entriesModel";
import { catchController, ResponseStatus } from "../../../utils";
import User from "../../model/userModel";

const resp = new ResponseStatus();

export const getUserProfile = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;

    let user: IUser | null = await User.findById(user_id).select("-__v");

    if (!user) {
      return resp.setError(StatusCodes.NOT_FOUND, "User not found").send(res);
    }

    // convert mongoose data to object
    user = user.toObject();

    // get the lates 5 entries created by the user
    const entries = await Entry.find({ user: user_id, deleted: false })
      .sort({ createdAt: -1 })
      .limit(3)
      .select("-__v -user -updatedAt");
    user.entries = entries;

    return resp.setSuccess(StatusCodes.OK, user, "success").send(res);
  }
);
