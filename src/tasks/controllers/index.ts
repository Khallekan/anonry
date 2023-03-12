import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Task from '../model/taskModel';
import catchController from '../../utils/catchControllerAsyncs';
import ResponseStatus from '../../utils/response';

const resp = new ResponseStatus();

export const createTask = catchController(
  async (req: Request, res: Response) => {
    const user_id: string = req.user._id;
    const {
      title,
      description,
      due_date,
      tags,
    }: {
      title: string | undefined;
      description: string | undefined;
      due_date: string | undefined;
      tags: string[] | undefined;
    } = req.body;

    if (!description) {
      return resp.setError(
        StatusCodes.BAD_REQUEST,
        'Description must be provided'
      );
    }

    if (title && typeof title !== 'string') {
      return resp.setError(StatusCodes.BAD_REQUEST, 'Invalid title').send(res);
    }

    if (description && typeof description !== 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid description')
        .send(res);
    }

    if (due_date && typeof due_date !== 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid due_date')
        .send(res);
    }

    if (description.length < 5) {
      return resp.setError(
        StatusCodes.BAD_REQUEST,
        'Description must be at least 5 characters long'
      );
    }

    interface INewTask {
      description: string;
      title?: string;
      due_date?: string;
      user: string;
      tags?: string[];
    }

    const newTask: INewTask = {
      description: description,
      user: user_id,
    };

    if (title) {
      newTask.title = title;
    }

    if (due_date) {
      newTask.due_date = new Date(due_date).toISOString();
    }

    if (tags) {
      newTask.tags = tags;
    }

    const task = await Task.create(newTask);

    return resp
      .setSuccess(StatusCodes.CREATED, task, 'Task created successfully')
      .send(res);
  }
);
