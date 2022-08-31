import { Schema, model } from "mongoose";
import { ITask } from "../../common/types";

// Create Mongoose Model to store items in a todo list
const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [50, "Title must be less than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [500, "Description must be less than 500 characters"],
    },
    user: {
      type: String,
      ref: "user",
    },
    status: {
      type: String,
      enum: ["pending", "active", "completed"],
      default: "pending",
    },
    due_date: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    permanently_deleted: {
      type: Boolean,
      default: false,
      select: false,
    }
  },
  { timestamps: true, validateBeforeSave: true }
);

export default model<ITask>("tasks", TaskSchema);
