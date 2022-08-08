import { Schema, model } from "mongoose";
import { ITags } from "../../common/types";

const TagsModel = new Schema<ITags>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

export default model<ITags>("tags", TagsModel);
