import Trash from "../model/trashModel";
import catchController from "../../utils/catchControllerAsyncs";
import createPageInfo from "../../utils/createPagination";
import { Request, Response, NextFunction } from "express";
import ResponseStatus from "../../utils/response";
import Likes from "../../likes/model/likesModel";
import Entry from "../../entries/model/entriesModel";
import { StatusCodes } from "http-status-codes";
import User from "../../users/model/userModel";
import trashScheduler from "../utils/trash-cron";

export const trashCron = trashScheduler();

const resp = new ResponseStatus();

export const getTrash = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    let sort: string,
      limit: number,
      page: number,
      totalDocuments: number,
      type: "entry" | "task" | undefined;

    // If page and limit are of invalid types return error
    if (req.query.page && typeof req.query.page != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Page must be a string")
        .send(res);
    }
    if (req.query.limit && typeof req.query.limit != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Limit must be a string")
        .send(res);
    }
    if (req.query.sort && typeof req.query.sort != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Sort must be a string")
        .send(res);
    }
    if (req.query.type && typeof req.query.type != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Type must either be entry or task")
        .send(res);
    }
    limit = req.query.limit ? parseInt(req.query.limit) : 20;
    page = req.query.page ? parseInt(req.query.page) : 1;
    sort = req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt";
    if (
      (req.query.type && req.query.type === "entry") ||
      req.query.type === "task"
    ) {
      type = req.query.type;
    }

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    // define the type of the search object
    interface ISearchBy {
      user: string;
      type?: "entry" | "task";
    }

    // define parameters to search by
    const searchBy: ISearchBy = {
      user: user_id,
    };

    if (type) {
      searchBy.type = type;
    }

    // count documents that match the searchBy
    totalDocuments = await Trash.countDocuments(searchBy);

    const pageInfo = createPageInfo({
      limit,
      page,
      startIndex,
      totalDocuments,
    });

    // find all the entries in the trash
    const trash = await Trash.find(searchBy)
      .sort(sort)
      .limit(limit)
      .skip(startIndex);

    resp
      .setSuccess(
        StatusCodes.OK,
        { trash, pageInfo },
        "Trash fetched successfully"
      )
      .send(res);
  }
);

export const restoreTrash = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user._id;
    const trash_id: string[] | undefined = req.body.trash;

    if (!trash_id || !trash_id.length) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Trash Id missing")
        .send(res);
    }

    const trashItem = await Trash.find({ _id: { $in: trash_id }, user });

    if (trashItem.length !== trash_id.length) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Some Items are not in your trash")
        .send(res);
    }

    const entries = await Entry.find({
      _id: { $in: trashItem.map((trash) => trash.entry) },
      user,
      deleted: true,
      permanently_deleted: { $in: [false, null, undefined] },
    });

    if (entries.length !== trashItem.length) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Some entries are not found")
        .send(res);
    }

    await entries.forEach(async (entry) => {
      entry.deleted = false;
      await entry.save();
    });

    resp
      .setSuccess(StatusCodes.OK, null, "Entries restored successfully")
      .send(res);

    const entriesLength = entries.length;

    const update: {
      $inc: { no_of_entries: number };
    } = {
      $inc: {
        no_of_entries: entriesLength,
      },
    };

    const data = await User.findByIdAndUpdate(user, update, { new: true });

    await Trash.deleteMany({ _id: { $in: trash_id } });

    await Likes.updateMany(
      { entry: { $in: entries.map((entry) => entry._id) } },
      { $set: { entry_deleted: false } }
    );
  }
);

export const deleteTrash = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user._id;
    let trash_id: string[];

    if (!req.query.trash || typeof req.query.trash != "string") {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Trash Id missing")
        .send(res);
    }

    // regex that matches space
    const spaceRegex = /\s/g;

    trash_id = req.query.trash.trim().replace(spaceRegex, "").split(",");

    const trashItem = await Trash.find({ _id: { $in: trash_id }, user });

    if (trashItem.length !== trash_id.length) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Some items are not in your trash")
        .send(res);
    }

    const entry = await Entry.find({
      user,
      _id: { $in: trashItem.map((trash) => trash.entry) },
      permanently_deleted: { $in: [null, false, undefined] },
    });

    if (entry.length !== trashItem.length) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    await entry.forEach(async (entry) => {
      entry.permanently_deleted = true;
      await entry.save();
    });

    resp
      .setSuccess(StatusCodes.OK, null, "Entries deleted successfully")
      .send(res);

    await Trash.deleteMany({
      _id: { $in: trashItem.map((trash) => trash._id) },
    });
    return;
  }
);

export const restoreAll = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user._id;

    const trashItems = await Trash.find({ user: user });

    if (!trashItems.length) {
      return resp
        .setError(
          StatusCodes.NOT_ACCEPTABLE,
          "Your trash is empty anonymous one!"
        )
        .send(res);
    }

    const entries = await Entry.find({
      _id: { $in: trashItems.map((trash) => trash.entry) },
      user,
      deleted: true,
      permanently_deleted: false,
    });

    if (entries.length !== trashItems.length) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Some entries are not found")
        .send(res);
    }

    await entries.forEach(async (entry) => {
      entry.deleted = false;
      await entry.save();
    });

    resp
      .setSuccess(StatusCodes.OK, null, "Entries restored successfully")
      .send(res);

    const entriesLength = entries.length;

    const userToUpdate = await User.findById(user);

    if (userToUpdate) {
      userToUpdate.no_of_entries += entriesLength;
      await userToUpdate.save();
    }

    await Trash.deleteMany({
      _id: { $in: trashItems.map((item) => item._id) },
    });

    await Likes.updateMany(
      { entry: { $in: entries.map((entry) => entry._id) } },
      { $set: { entry_deleted: false } }
    );
  }
);

export const deleteAll = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user._id;

    const trashItems = await Trash.find({ user: user });

    if (!trashItems.length) {
      return resp
        .setError(
          StatusCodes.NOT_ACCEPTABLE,
          "Your trash is empty anonymous one!"
        )
        .send(res);
    }

    const entries = await Entry.find({
      _id: { $in: trashItems.map((trash) => trash.entry) },
      user,
      deleted: true,
      permanently_deleted: false,
    });

    if (entries.length !== trashItems.length) {
      return resp
        .setError(
          StatusCodes.NOT_FOUND,
          "Some entries not are not in your trash anonymous one!"
        )
        .send(res);
    }

    await entries.forEach(async (entry) => {
      entry.permanently_deleted = true;
      await entry.save();
    }),
      await Trash.deleteMany({
        _id: { $in: trashItems.map((trash) => trash._id) },
      });
    return resp
      .setSuccess(StatusCodes.OK, null, "Entries deleted successfully")
      .send(res);
  }
);
