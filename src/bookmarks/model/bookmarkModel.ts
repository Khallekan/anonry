import { Schema, model } from "mongoose";
import { IBookmark } from "../../common/types";
import User from "../../users/model/userModel";

const bookmarkModel = new Schema<IBookmark>(
  {
    bookmarked_by: {
      type: String,
      ref: "user",
      required: [true, "Please provide a user"],
    },
    entry: {
      type: String,
      ref: "entries",
      required: [true, "Please provide an entry"],
    },
    tags: {
      type: [
        {
          type: String,
          ref: "tags",
        },
      ],
    },
    published_by: {
      type: String,
      ref: "user",
      required: [true, "Please provide an entry owner"],
    },
  },
  { timestamps: true }
);

// on find populate with user and entry
bookmarkModel.pre(/^find/, function (next) {
  this.populate("bookmarked_by", "name email avatar");
  this.populate("published_by", "name email avatar");
  this.populate("tags");
  this.populate("entry", "+title +description -user");
  next();
});

export default model<IBookmark>("bookmark", bookmarkModel);
