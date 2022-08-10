import { ILikesModel } from "common/types";
import { Schema, model } from "mongoose";

const likesModel = new Schema<ILikesModel>(
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

likesModel.pre(/^find/, function (next) {
  this.populate("liked_by", "avatar user_name");
  this.populate("owner", "avatar user_name");
  this.populate("entry", "title description tags no_of_likes");
  next();
});

export default model<ILikesModel>("likes", likesModel);
