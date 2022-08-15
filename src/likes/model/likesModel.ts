import { Schema, model } from "mongoose";
import { ILikesModel } from "../../common/types";
import {ObjectId} from "mongodb";

const likesModel = new Schema<ILikesModel>(
  {
    entry: {
      type: ObjectId,
      ref: "entries",
    },
    owner: {
      type: ObjectId,
      ref: "user",
    },
    liked_by: {
      type: ObjectId,
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
