import { Schema, model } from "mongoose";
import { IEntry } from "../../common/types";

// create mongoose schema to store blog post
const notesSchema = new Schema<IEntry>(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [100, "Title must be less than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],

      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [1000, "Description must be less than 500 characters"],
    },
    user: {
      type: String,
      ref: "User",
      required: [true, "Please provide a user"],
    },
    no_of_likes: {
      type: Number,
      default: 0,
    },
    liked_by: {
      type: [{ type: Schema.Types.ObjectId, ref: "user" }],
      default: [],
    },
    no_of_comments: {
      type: Number,
      default: 0,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default model<IEntry>("notes", notesSchema);
