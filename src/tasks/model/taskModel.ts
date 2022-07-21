import { Schema, model } from "mongoose";
// Create Mongoose Model to store items in a todo list
const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide a title"],
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [50, "Title must be less than 50 characters"],
    },
    description: {
      type: String,
      required: [true, "Please provide a description"],
      minlength: [5, "Description must be at least 5 characters"],
      maxlength: [500, "Description must be less than 500 characters"],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    completed_at: {
      type: Date,
    },
  },
  { timestamps: true }
);


export default model("tasks", TaskSchema);