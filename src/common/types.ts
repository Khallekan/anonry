import { Document, Model } from "mongoose";

export interface IUser extends Document {
  user_name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  role: string;
  verified: boolean;
  status: string;
  otpToken: string;
  otpExpires: Date;
  createOTP(): string;
  validateOTP(candidateToken:string, token:string, type:string): boolean;
}

export interface IUserModel extends Model<IUser> {
  createOTP(): any;
}
