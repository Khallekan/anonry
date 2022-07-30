import { Schema, model } from "mongoose";
import { IEntry } from "../../common/types";
import User from "../../users/model/userModel";

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

// Update the user's no_of_entries everytime a new entry is created
entrySchema.post("save", async function (doc) {
  const user = await User.findById(doc.user);
  if (user) {
    user.no_of_entries = user.no_of_entries + 1;
    user.save();
  }
});

export default model<IEntry>("notes", entrySchema);
