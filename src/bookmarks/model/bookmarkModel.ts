import { Schema, model } from "mongoose";
import { IBookmark } from "../../common/types";

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
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);

// on find populate with user and entry
bookmarkModel.pre(/^find/, function (next) {
  this.populate("user", "name email avatar");
  this.populate({
    path: "entry",
    select: "title",
  });
  next();
});

export default model<IBookmark>("bookmark", bookmarkModel);
