import mongoose, { model, Schema, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { IBookmark } from '../../common/types';

const bookmarkModel = new Schema<IBookmark>(
  {
    bookmarked_by: {
      type: Types.ObjectId,
      ref: 'user',
      required: [true, 'Please provide a user'],
    },
    entry: {
      type: Types.ObjectId,
      ref: 'entries',
      required: [true, 'Please provide an entry'],
    },
    tags: {
      type: [
        {
          type: Types.ObjectId,
          ref: 'tags',
        },
      ],
    },
    published_by: {
      type: Types.ObjectId,
      ref: 'user',
      required: [true, 'Please provide an entry owner'],
    },
  },
  { timestamps: true }
);

bookmarkModel.plugin(paginate);

// on find populate with user and entry
bookmarkModel.pre(/^find/, function (next) {
  this.populate('bookmarked_by', 'name email avatar');
  this.populate('published_by', 'name email avatar');
  this.populate('tags');
  this.populate('entry', '+title +description -user');
  next();
});

interface BookmarkMethods {}

export default model<
  IBookmark,
  mongoose.PaginateModel<IBookmark, Record<string, string>, BookmarkMethods>
>('bookmark', bookmarkModel);
