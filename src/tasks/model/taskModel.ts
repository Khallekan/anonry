import mongoose, { model, Schema, Types } from 'mongoose';
import paginate from 'mongoose-paginate-v2';

import { ITask } from '../../common/types';

// Create Mongoose Model to store items in a todo list

const TaskTagSchema = new Schema<{ name: string; color: string }>({
  name: { type: String, lowercase: true },
  color: { type: String, lowercase: true },
});

const ReminderSchema = new Schema<{ time: Date; completed: boolean }>({
  time: Date,
  completed: { type: Boolean, default: false },
});

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [50, 'Title must be less than 50 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      minlength: [5, 'Description must be at least 5 characters'],
      maxlength: [500, 'Description must be less than 500 characters'],
    },
    user: {
      type: Types.ObjectId,
      ref: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'completed'],
      default: 'pending',
    },
    due_date: {
      type: Date,
    },
    deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    reminder: [ReminderSchema],
    permanently_deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    tags: [TaskTagSchema],
  },
  { timestamps: true, validateBeforeSave: true }
);

TaskSchema.plugin(paginate);

// on find populate with user and entry
TaskSchema.pre(/^find/, function (next) {
  this.populate('user', '-__v ');
  next();
});

interface TasksMethods {}

export default model<
  ITask,
  mongoose.PaginateModel<ITask, Record<string, string>, TasksMethods>
>('tasks', TaskSchema);
