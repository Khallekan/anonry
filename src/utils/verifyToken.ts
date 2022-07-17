import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../users/model/userModel";
import ResponseStatus from "./response"

const response = new ResponseStatus();

async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      
      const token = req.headers.authorization.split(" ")[1];

      const decoded = <any>(
        jwt.verify(token, process.env.JWT_SECRET_KEY as string)
      );

      const user = await User.findById(decoded.id);
      if (!user) {
        return response.setError(404, "User not found").send(res);
      }
      if (user.status === "unverified") {
        response.setError(401, "user needs to be verified");
        return response.send(res);
      }
      req.body.user = user;
      return next();
    } catch (error) {
      console.error(error);
      response.setError(401, "Token has expired, please login again");
      return response.send(res);
    }
  } else {
    response.setError(404, "Invalid token or token is missing");
    return response.send(res);
  }
}
export default verifyToken;