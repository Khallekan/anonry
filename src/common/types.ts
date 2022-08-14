import { Document, Model, Schema } from "mongoose";
import { Request as REQUEST } from "express";

export interface Request extends REQUEST {
  user: IUser;
}

// User Interface
export interface IUser extends Document {
  _id: string;
  user_name: string;
  email: string;
  password: string;
  created_at: Date;
  updated_at: Date;
  role: string;
  avatar: string;
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
  deactivated_at: Date;
  no_of_likes: number;
  no_of_dislikes: number;
  no_of_bookmarks: number;
  no_of_comments: number;
  no_of_published_entries: number;
  no_of_notes: number;
  no_of_entries: number;
  no_of_drafts: number;
  updatedAt: Date;
  entries: IEntry[];
  createdAt: Date;
  createOTP(): string;
  validateOTP(candidateToken: string, token: string, type: string): boolean;
  validatePassword(candidatePassword: string): boolean;
}

// Entry Interface
export interface IEntry extends Document {
  title: string;
  description: string;
  tags?: string[];
  user: IUser;
  no_of_likes: number;
  liked_by: string[] | undefined;
  no_of_comments: number;
  edited: boolean;
  published: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;
}

// Task Interface
export interface ITask extends Document {
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
  user: IUser;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmark extends Document {
  bookmarked_by: IUser;
  entry: IEntry;
  published_by: IUser;
  tags: ITags[];
}

export interface IUserModel extends Model<IUser> {
  createOTP(): any;
}

export interface ITags extends Document {
  name: string;
}

export interface ILikesModel extends Document {
  liked_by: string;
  owner: string;
  entry: string;
}

export type ResponseData = Record<string, any> | Record<string, any>[];

export interface IPageInfo {
  totalPages: number;
  totalHits: number;
  next?: {
    page: number;
    limit: number;
  };
  previous?: {
    page: number;
    limit: number;
  };
}
