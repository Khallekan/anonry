import { ILikesModel } from "common/types";
import { Schema, model } from "mongoose";

const LikesModel = new Schema<ILikesModel>(
  {
    entry: {
      type: String,
      ref: "entries",
    },
    owner: {
      type: String,
      ref: "user",
    },
    liked_by: {
      type: String,
      ref: "user",
    },
  },
  { timestamps: true }
);

export default model<ILikesModel>("likes", LikesModel);
