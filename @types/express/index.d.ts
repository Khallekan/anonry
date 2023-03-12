import { IUser } from '../../src/common/types';

declare module 'express-serve-static-core' {
  interface Request {
    user: IUser;
  }
}

declare global {
  namespace Express {
    interface User extends IUser {}
  }
}
