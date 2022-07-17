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
  deleted: boolean;
  deleted_at: Date;
  suspended: boolean;
  suspended_at: Date;
  suspended_reason: string;
  suspended_till: Date;
  deactivated: boolean;
  createOTP(): string;
  validateOTP(candidateToken: string, token: string, type: string): boolean;
  validatePassword(candidatePassword: string): boolean;
}

export interface IUserModel extends Model<IUser> {
  createOTP(): any;
}

export type ResponseData = Record<string, any> | Record<string, any>[];
