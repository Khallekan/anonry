import { NextFunction, Request, Response } from "express";
import catchControllerAsyncs from "../../../utils/catchControllerAsyncs";
import User from "../../model/userModel";

export const getUserProfile = catchControllerAsyncs(async (req: Request, res: Response, next: NextFunction) => {
  const user_id: string = req.body.user_id;
  const user = await User.findById(user_id);
  
})