import { Schema, model } from "mongoose";
import { IEntry } from "../../common/types";

// create mongoose schema to store blog post
const entrySchema = new Schema<IEntry>(
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
    tags: {
      type: [
        {
          type: String,
          ref: "tags",
        },
      ],
    },
    user: {
      type: String,
      ref: "user",
      required: [true, "Please provide a user"],
    },
    no_of_likes: {
      type: Number,
      default: 0,
    },
    published: {
      type: Boolean,
      default: false,
    },
    liked_by: {
      type: [{ type: String, ref: "user" }],
      default: [],
    },
    no_of_comments: {
      type: Number,
      default: 0,
    },
    edited: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

// populate the fields that reference other models in the database before finding
entrySchema.pre(/^find/, function (next) {
  this.populate("user", "-createdAt -updatedAt -__v");
  this.populate("tags", "-createdAt -updatedAt -__v");
  this.populate("liked_by", "-createdAt -updatedAt __v");
  next();
});

export default model<IEntry>("entries", entrySchema);
