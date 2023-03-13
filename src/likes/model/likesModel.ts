import { ObjectId } from 'mongodb';
import mongoose, { model, Schema } from 'mongoose';

import { ILikesModel } from '../../common/types';

const likesModel = new Schema<ILikesModel>(
  {
    entry: {
      type: ObjectId,
      ref: 'entries',
    },
    owner: {
      type: ObjectId,
      ref: 'user',
    },
    liked_by: {
      type: ObjectId,
      ref: 'user',
    },
    entry_deleted: {
      type: Boolean,
      default: false,
    },
    entry_unpublished: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

likesModel.pre(/^find/, function (next) {
  // select only the avatar user_name and _id when populating

  this.populate(
    'entry',
    '+title +description +tags +no_of_likes -user -liked_by -no_of_comments -__v'
  );
  this.populate('liked_by', 'avatar user_name');
  this.populate('owner', 'avatar user_name');
  next();
});

interface LikesMethods {}

export default model<
  ILikesModel,
  mongoose.PaginateModel<ILikesModel, Record<string, string>, LikesMethods>
>('likes', likesModel);
