import { Document, Model, PopulatedDoc, Types } from 'mongoose';

// User Interface
export interface IUser {
  _id: Types.ObjectId;
  google: {
    id: string;
    email: string;
    name: string;
  };
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
  no_of_likes_given: number;
  no_of_comments: number;
  no_of_published_entries: number;
  no_of_notes: number;
  no_of_entries: number;
  no_of_drafts: number;
  updatedAt: Date;
  entries: IEntry[];
  createdAt: Date;
  toObject: () => IUser;
}

// Entry Interface
export interface IEntry {
  title: string;
  description: string;
  tags?: ITags[];
  user: IUser;
  no_of_likes: number;
  liked_by: string[] | undefined;
  no_of_comments: number;
  edited: boolean;
  published: boolean;
  deleted: boolean;
  permanently_deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;
  _id: Types.ObjectId;
}

// Task Interface
export interface ITask {
  title: string;
  description: string;
  status: 'pending' | 'active' | 'completed';
  due_date: Date;
  user: PopulatedDoc<IUser>;
  deleted: boolean;
  permanently_deleted: false;
  createdAt: Date;
  updatedAt: Date;
  reminder: Date[];
  tags: { name: string; color?: string }[];
}

// Bookmark Interface
export interface IBookmark {
  bookmarked_by: PopulatedDoc<IUser>;
  entry: PopulatedDoc<IEntry>;
  published_by: PopulatedDoc<IUser>;
  tags: PopulatedDoc<ITags>[];
}

export interface IUserModel extends Model<IUser> {
  createOTP(): void;
}

// Tag interface
export interface ITags {
  name: string;
}

// Likes interface
export interface ILikesModel {
  liked_by: IUser;
  owner: IUser;
  entry: IEntry;
  entry_deleted: boolean;
  entry_unpublished: boolean;
}

// Trash Interface
export interface ITrash extends Document {
  entry?: IEntry;
  task?: ITask;
  type: 'entry' | 'task';
  user?: IUser;
  expiry_date: Date;
}

// export type ResponseData = Record<string, any> | Record<string, any>[];

// Page Info Interface
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

export interface IPageData {
  page: number;
  totalPages: number;
  totalHits: number;
  next?: {
    page: number;
  };
  previous?: {
    page: number;
  };
}
