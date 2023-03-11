import { NextFunction, Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import jwt from 'jsonwebtoken';

import ResponseStatus from './response';
import User from '../users/model/userModel';

const response = new ResponseStatus();

async function verifyToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      const token = req.headers.authorization.split(' ')[1];

      const decoded = <{ type?: string; id: string }>(
        jwt.verify(token, process.env.JWT_SECRET_KEY as string)
      );

      if (decoded.type && decoded.type !== 'access') {
        response
          .setError(
            StatusCodes.FORBIDDEN,
            'Provided token is not an access token'
          )
          .send(res);
      }

      const user = await User.findById(decoded.id);
      if (!user) {
        return response
          .setError(StatusCodes.NOT_FOUND, 'User not found')
          .send(res);
      }
      if (user.status === 'unverified') {
        response.setError(
          StatusCodes.UNAUTHORIZED,
          'user needs to be verified'
        );
        return response.send(res);
      }
      req.user = user;
      return next();
    } catch (error) {
      console.error(error);
      response.setError(
        StatusCodes.UNAUTHORIZED,
        'Token has expired, please login again'
      );
      return response.send(res);
    }
  } else {
    response.setError(
      StatusCodes.BAD_REQUEST,
      'Invalid token or token is missing'
    );
    return response.send(res);
  }
}
export default verifyToken;
