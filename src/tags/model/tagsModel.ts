import mongoose, { model, Schema } from 'mongoose';

import { ITags } from '../../common/types';

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

interface TagsMethods {}

export default model<
  ITags,
  mongoose.PaginateModel<ITags, Record<string, string>, TagsMethods>
>('tags', TagsModel);
