import mongoose, { model, Schema } from 'mongoose';

import { ITrash } from '../../common/types';

const trashModel = new Schema<ITrash>(
  {
    type: {
      type: String,
      enum: ['entry', 'task'],
      required: [true, 'Please provide a type'],
    },
    entry: {
      type: Schema.Types.ObjectId,
      ref: 'entries',
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: 'tasks',
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: [true, 'Please provide a user'],
    },
    expiry_date: {
      type: Date,
      required: [true, 'Please provide a date'],
    },
  },
  { timestamps: true }
);

trashModel.pre(/^find/, function (next) {
  // select only the avatar user_name and _id when populating
  this.populate(
    'entry',
    '+title +description +tags +no_of_likes -user -liked_by -no_of_comments -__v'
  );
  this.populate('task');

  next();
});

interface TrashMethods {}

export default model<
  ITrash,
  mongoose.PaginateModel<ITrash, Record<string, string>, TrashMethods>
>('trash', trashModel);
