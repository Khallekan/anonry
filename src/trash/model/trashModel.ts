import { Schema, model } from "mongoose";
import { ITrash } from "../../common/types";

const trashModel = new Schema<ITrash>(
  {
    type: {
      type: String,
      enum: ["entry", "task"],
      required: [true, "Please provide a type"],
    },
    entry: {
      type: Schema.Types.ObjectId,
      ref: "entry",
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "task",
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: [true, "Please provide a user"],
    },
    deleted_at: {
      type: Date,
      required: [true, "Please provide a date"],
    },
  },
  { timestamps: true }
);

export default model<ITrash>("trash", trashModel);
