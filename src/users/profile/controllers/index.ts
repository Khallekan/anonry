import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import catchControllerAsyncs from "../../../utils/catchControllerAsyncs";
import ResponseStatus from "../../../utils/response";
import User from "../../model/userModel";

const resp = new ResponseStatus();

export const getUserProfile = catchControllerAsyncs(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    console.log(user_id);
    
    const user = await User.findById(user_id).select("-__v");
    console.log({user});
    
    if (!user) {
      return resp.setError(StatusCodes.NOT_FOUND, "User not found").send(res);
    }
    return resp.setSuccess(StatusCodes.OK, user, "success").send(res);
  }
);
