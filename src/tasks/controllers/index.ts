import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Types } from 'mongoose';

import Task from '../model/taskModel';
import { ITask } from '../../common/types';
import catchController from '../../utils/catchControllerAsyncs';
import { createPageData } from '../../utils/createPagination';
import ResponseStatus from '../../utils/response';

const resp = new ResponseStatus();
const INVALID_TASK_ID = 'Invalid task id';
const TASK_NOT_FOUND = 'Task not found';

function isISODate(dateString: string): boolean {
  const isoRegExp = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d{1,3})?Z$/;
  return isoRegExp.test(dateString);
}
function validateEveryReminder(reminder: string[] | undefined): boolean {
  if (!Array.isArray(reminder)) {
    return false;
  }
  return reminder.every((date) => isISODate(date));
}

function checkTagsValid(tags: unknown): boolean {
  return !!(tags && tags instanceof Array && tags.every((tag) => !!tag.name));
}

export const getAllTasks = catchController(
  async (req: Request, res: Response) => {
    const user_id: Types.ObjectId = req.user._id;

    const page = parseInt(`${req.query.page}`, 10) || 1;
    const limit = parseInt(`${req.query.limit}`, 10) || 20;

    const sort =
      req.query.sort && typeof req.query.sort === 'string'
        ? req.query.sort.split(',').join(', ')
        : '-due_date -createdAt';
    // type OneOnly<Obj, Key extends keyof Obj> = {
    //   [key in Exclude<keyof Obj, Key>]: null;
    // } & Pick<Obj, Key>;
    // type OneOfByKey<T> = { [key in keyof T]: OneOnly<T, key> };
    // type ValueOf<Obj> = Obj[keyof Obj];
    // type OneOfType<T> = ValueOf<OneOfByKey<T>>;
    type Keys =
      | keyof Pick<ITask, 'description' | 'title' | 'status'>
      | 'tags.name';
    const searchBy: {
      deleted: false;
      permanently_deleted: false;
      $or?: { [P in Keys]?: { $regex: string; $options: 'i' } }[];
      user: Types.ObjectId;
    } = {
      deleted: false,
      permanently_deleted: false,
      user: user_id,
    };
    if (req.query.search && typeof req.query.search === 'string') {
      searchBy.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } },
        { status: { $regex: req.query.search, $options: 'i' } },
        { 'tags.name': { $regex: req.query.search, $options: 'i' } },
      ];
    }
    const tasks = await Task.paginate(searchBy, {
      limit,
      page,
      sort,
      select: '-__v',
      customLabels: {
        docs: 'data',
        totalDocs: 'totalHits',
        totalPages: 'totalPages',
        nextPage: 'nextPage',
        prevPage: 'prevPage',
        hasNextPage: 'hasNextPage',
        hasPrevPage: 'hasPrevPage',
      },
    });

    const {
      data,
      totalHits,
      totalPages,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
    } = tasks;

    const pageInfo = createPageData({
      page: page,
      totalPages,
      totalHits: totalHits as number,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
    });
    resp
      .setSuccess(
        StatusCodes.OK,
        { data, pageInfo },
        'tasks fetched successfully'
      )
      .send(res);
  }
);

export const getSingleTask = catchController(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user_id = req.user._id;
    if (!id || typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      return resp.setError(StatusCodes.BAD_REQUEST, INVALID_TASK_ID).send(res);
    }
    const searchBy: {
      deleted: false;
      permanently_deleted: false;
      user: Types.ObjectId;
      _id: Types.ObjectId;
    } = {
      deleted: false,
      permanently_deleted: false,
      user: user_id,
      _id: new Types.ObjectId(id),
    };

    const task = await Task.findOne(searchBy).select('-__v');

    if (!task) {
      return resp.setError(StatusCodes.NOT_FOUND, TASK_NOT_FOUND).send(res);
    }

    return resp
      .setSuccess(StatusCodes.OK, { data: task }, 'task fetched successfully')
      .send(res);
  }
);

export const createTask = catchController(
  async (req: Request, res: Response) => {
    const user_id: Types.ObjectId = req.user._id;
    const {
      title,
      description,
      due_date,
      tags,
      reminder,
    }: {
      title: string | undefined;
      description: string | undefined;
      due_date: string | undefined;
      tags: { name: string; color?: string }[] | undefined;
      reminder: string[] | undefined;
    } = req.body;

    if (!description) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Description must be provided')
        .send(res);
    }

    if (description && typeof description !== 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid description')
        .send(res);
    }

    if (description.length < 5) {
      return resp
        .setError(
          StatusCodes.BAD_REQUEST,
          'Description must be at least 5 characters long'
        )
        .send(res);
    }

    if (title && typeof title !== 'string') {
      return resp.setError(StatusCodes.BAD_REQUEST, 'Invalid title').send(res);
    }

    if (due_date && !isISODate(due_date)) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid due date')
        .send(res);
    }

    if (reminder && !validateEveryReminder(reminder)) {
      return resp
        .setError(
          StatusCodes.BAD_REQUEST,
          'Reminder must be an array of dates in ISO format'
        )
        .send(res);
    }

    if (tags && !checkTagsValid(tags)) {
      return resp
        .setError(
          StatusCodes.BAD_REQUEST,
          'Tags must be an array having at least the name key'
        )
        .send(res);
    }

    interface INewTask {
      description: string;
      title?: string;
      due_date?: string;
      user: Types.ObjectId;
      tags?: { name: string; color?: string }[];
      reminder?: string[];
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

    if (reminder) {
      newTask.reminder = reminder;
    }

    const task = await Task.create(newTask);

    return resp
      .setSuccess(StatusCodes.CREATED, task, 'Task created successfully')
      .send(res);
  }
);

export const updateSingleTask = catchController(
  async (req: Request, res: Response) => {
    const user_id = req.user._id;
    const task_id = req.params.id;

    const task = await Task.findOne({
      _id: new Types.ObjectId(task_id),
      user: user_id,
      permanently_deleted: false,
      deleted: false,
    });

    if (!task) {
      return resp.setError(StatusCodes.NOT_FOUND, TASK_NOT_FOUND).send(res);
    }
    const {
      title,
      description,
      due_date,
      tags,
      reminder,
      status,
    }: {
      title: string | undefined;
      description: string | undefined;
      due_date: string | undefined;
      tags: { name: string; color?: string }[] | undefined;
      reminder: string[] | undefined;
      status: typeof task.status;
    } = req.body;
    const updatedTask: Partial<ITask> = {};

    if (description && typeof description !== 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid description')
        .send(res);
    }

    if (title && typeof title !== 'string') {
      return resp.setError(StatusCodes.BAD_REQUEST, 'Invalid title').send(res);
    }

    if (due_date && !isISODate(due_date)) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid due date')
        .send(res);
    }

    if (tags && !checkTagsValid(tags)) {
      return resp
        .setError(
          StatusCodes.BAD_REQUEST,
          'Tags must be an array having at least the name key'
        )
        .send(res);
    }

    if (reminder && !validateEveryReminder(reminder)) {
      return resp
        .setError(
          StatusCodes.BAD_REQUEST,
          'Reminder must be an array of dates in ISO format'
        )
        .send(res);
    }

    if (
      status &&
      status !== 'active' &&
      status !== 'completed' &&
      status !== 'pending'
    ) {
      return resp.setError(StatusCodes.BAD_REQUEST, 'Invalid status').send(res);
    }

    if (title && typeof title === 'string') {
      updatedTask.title = title;
    }

    if (description && typeof description === 'string') {
      updatedTask.description = description;
    }

    if (due_date && isISODate(due_date)) {
      updatedTask.due_date = due_date as unknown as Date;
    }

    if (tags && checkTagsValid(tags)) {
      updatedTask.tags = tags.map((tag) => {
        const existingTag = task.tags.find(
          (documentTag) => documentTag.name === tag.name.toLowerCase()
        );

        return existingTag ? { ...existingTag, ...tag } : tag;
      });
    }

    if (reminder && validateEveryReminder(reminder)) {
      updatedTask.reminder = Array.from(
        new Set([...reminder.map((date) => new Date(date))])
      );
    }

    if (status) {
      updatedTask.status = status;
    }
    console.log({ updatedTask });
    const updated = await Task.findOneAndUpdate(
      { _id: task._id },
      updatedTask,
      {
        new: true,
      }
    ).select('-__v');

    return resp
      .setSuccess(
        StatusCodes.OK,
        { data: updated },
        'Task updated successfully'
      )
      .send(res);
  }
);

export const deleteSingleTask = catchController(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const user_id = req.user._id;

    if (typeof id !== 'string' || !Types.ObjectId.isValid(id)) {
      return resp.setError(StatusCodes.BAD_REQUEST, INVALID_TASK_ID).send(res);
    }

    const task = await Task.findOne({
      user: user_id,
      _id: new Types.ObjectId(id),
      permanently_deleted: false,
      deleted: false,
    });

    if (!task) {
      return resp.setError(StatusCodes.NOT_FOUND, TASK_NOT_FOUND).send(res);
    }
    await task.updateOne(
      {
        deleted: true,
      },
      { new: true }
    );

    return resp
      .setSuccess(StatusCodes.OK, null, 'Task deleted successfully')
      .send(res);
  }
);

export const deleteTasks = catchController(
  async (req: Request, res: Response) => {
    const user_id = req.user._id;
    const tasks = req.query.tasks;

    if (!tasks) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'tasks is required')
        .send(res);
    }

    if (tasks && (typeof tasks !== 'string' || !tasks.length)) {
      return resp.setError(StatusCodes.BAD_REQUEST, 'invalid tasks').send(res);
    }

    const taskIds =
      req.query.tasks && typeof req.query.tasks === 'string'
        ? req.query.tasks.split(',')
        : [];
    const allValid: boolean = taskIds.every((id) => Types.ObjectId.isValid(id));

    if (!allValid) {
      return resp.setError(StatusCodes.BAD_REQUEST, INVALID_TASK_ID).send(res);
    }

    const taskIdObjectId = taskIds.map((taskid) => new Types.ObjectId(taskid));

    await Task.updateMany(
      {
        user: user_id,
        _id: { $in: taskIdObjectId },
        deleted: false,
        permanently_deleted: false,
      },
      { deleted: true }
    );

    return resp
      .setSuccess(StatusCodes.OK, null, 'Tasks deleted successfully')
      .send(res);
  }
);
