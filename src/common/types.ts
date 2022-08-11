import { Document, Model } from "mongoose";
import { Request as REQUEST } from "express";

export interface Request extends REQUEST {
  user: IUser;
}

// User Interface
export interface IUser extends Document {
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
export interface IEntry {
  title: string;
  description: string;
  tags?: string[];
  user: IUser;
  no_of_likes: number;
  liked_by: IUser[];
  no_of_comments: number;
  edited: boolean;
  published: boolean;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Task Interface
export interface ITask {
  title: string;
  description: string;
  status: "pending" | "active" | "completed";
  user: string;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBookmark {
  bookmarked_by: string;
  entry: string;
  published_by: string;
  tags: ITags[];
}

export interface IUserModel extends Model<IUser> {
  createOTP(): any;
}

export interface ITags {
  name: string;
}

export interface ILikesModel {
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
