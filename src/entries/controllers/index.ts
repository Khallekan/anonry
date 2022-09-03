import User from "../../users/model/userModel";
import Entry from "../model/entriesModel";
import Tags from "../../tags/model/tagsModel";
import Trash from "../../trash/model/trashModel";
import Likes from "../../likes/model/likesModel";
import { NextFunction, Response } from "express";
import { Request } from "../../common/types";
import { StatusCodes } from "http-status-codes";
import ResponseStatus from "../../utils/response";
import catchController from "../../utils/catchControllerAsyncs";
import createPageInfo from "../../utils/createPagination";

const resp = new ResponseStatus();

export const getMyEntries = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;

    let limit: number, page: number, sort: string, totalDocuments: number;

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

    // if the page is defined and of a valid type convert it to number
    // if converted value is not a number assign a default value of 1
    page = req.query.page ? parseInt(req.query.page) : 1;
    // if the limit is defined and of a valid type convert it to number
    // if converted value is not a number assign a default value of 20
    limit = req.query.limit ? parseInt(req.query.limit) : 20;

    // if the sort is defined and of a valid type convert it to string
    // if converted value is not a string assign a default value of createdAt
    sort = req.query.sort ? req.query.sort.split(",").join(" ") : "-createdAt";

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    interface ISearchObject {
      user: string;
      deleted: { $in: (false | undefined | null)[] };
      permanently_deleted: { $in: (false | undefined | null)[] };
      published?: { $in: (boolean | undefined | null)[] };
    }

    const searchObj: ISearchObject = {
      user: user_id,
      deleted: { $in: [false, undefined, null] },
      permanently_deleted: { $in: [false, undefined, null] },
    };

    if (req.query.published && typeof req.query.published == "string") {
      const publishedType = req.query.published.trim().toLowerCase();
      if (publishedType === "true") {
        searchObj.published = { $in: [true] };
      }
      if (publishedType === "false") {
        searchObj.published = { $in: [false, null, undefined] };
      }
      if (publishedType !== "true" && publishedType !== "false") {
        return resp
          .setError(StatusCodes.BAD_REQUEST, "Invalid published type")
          .send(res);
      }
    }

    // find the total number of documents in the collection matching the search criteria
    totalDocuments = await Entry.countDocuments(searchObj);

    const pageInfo = createPageInfo({
      page,
      limit,
      startIndex,
      totalDocuments,
    });

    const entries = await Entry.find(searchObj)
      .select("-__v -user")
      .limit(limit)
      .skip(startIndex)
      .sort(sort)
      .select("-__v -liked_by");

    return resp
      .setSuccess(
        StatusCodes.OK,
        { entries, pageInfo },
        "Entries fetched successfully"
      )
      .send(res);
  }
);

export const getSingleEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const entry_id: string | undefined = req.params.id;
    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }
    const entry = await Entry.findOne({ _id: entry_id }).select(
      "-__v +deleted"
    );

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    if (entry.deleted) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Cannot view deleted entry")
        .send(res);
    }

    if (entry.permanently_deleted) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry fetched successfully")
      .send(res);
  }
);

export const createEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string | undefined = req.user._id;

    const {
      title,
      description,
      tags,
    }: {
      title: string | undefined;
      description: string | undefined;
      tags: string[] | undefined;
    } = req.body;

    if (!user_id || !title || !description) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "All fields are required")
        .send(res);
    }

    interface IEntryDetails {
      user: string;
      title: string;
      description: string;
      tags?: string[];
    }

    const entryDetails: IEntryDetails = {
      user: user_id,
      title: title,
      description: description,
    };

    if (tags && tags.length > 5) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Maximum 5 tags allowed")
        .send(res);
    }
    if (tags && tags.length <= 5) {
      // check if Tags exist
      const tagsExist = await Tags.find({ name: { $in: tags } });

      if (tagsExist.length !== tags.length) {
        return resp
          .setError(StatusCodes.NOT_FOUND, "Some tags do not exist")
          .send(res);
      }

      entryDetails.tags = tagsExist.map((tag) => tag._id.toString());
    }

    const entry = await (
      await Entry.create(entryDetails)
    ).populate("tags user");

    resp
      .setSuccess(StatusCodes.OK, entry, "Entry created successfully")
      .send(res);
    // update the user's no_of_entries
    await User.findByIdAndUpdate(user_id, {
      $inc: { no_of_entries: 1 },
    });
    return;
  }
);

export const editEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user.id;
    const entry_id: string = req.body.entry_id;
    const title: string = req.body.title;
    const description: string = req.body.description;

    if (!entry_id || !title || !description) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "All fields are required")
        .send(res);
    }
    const entry = await Entry.findOneAndUpdate(
      { _id: entry_id, user: user_id },
      {
        title: req.body.title,
        description: req.body.description,
        edited: true,
      },
      { new: true }
    );

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry updated successfully")
      .send(res);
  }
);

export const deleteEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    const entry_id: string | undefined = req.params.id;
    const date = new Date();
    date.setDate(date.getDate() + 30);

    console.log({ date });

    const expiry_date = date.toISOString();

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    const entry = await Entry.findById(entry_id).select(
      "+deleted +permanently_deleted"
    );

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    if (entry.user._id.toString() !== user_id.toString()) {
      return resp
        .setError(
          StatusCodes.UNAUTHORIZED,
          "You are not authorized to delete this entry"
        )
        .send(res);
    }

    if (entry.deleted) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry already deleted")
        .send(res);
    }

    entry.deleted = true;
    entry.published = false;
    await entry.save();

    // Update the user's no_of_entries everytime a new entry is deleted
    const userToUpdate = await User.findById(user_id);

    if (userToUpdate) {
      userToUpdate.no_of_entries -= 1;

      if (entry.published) {
        userToUpdate.no_of_published_entries -= 1;
      }

      if (entry.no_of_likes) {
        userToUpdate.no_of_likes -= entry.no_of_likes;
      }

      userToUpdate.save();
    }

    resp
      .setSuccess(StatusCodes.OK, null, "Entry moved to trash successfully")
      .send(res);

    await Trash.create({
      user: user_id,
      entry: entry_id,
      type: "entry",
      expiry_date,
    });

    console.log("TRASH ITEM CREATED SUCCESSFULLY");

    await Likes.updateMany(
      { entry: entry._id },
      { $set: { entry_deleted: true, entry_unpublished: true } }
    );

    console.log("LIKES UPDATED SUCCESSFULLY");

    return;
  }
);

export const publishEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.user._id;
    const entry_id: string | undefined = req.params.id;
    let action: string | undefined = req.body.action;
    const validActions = ["publish", "unpublish"];

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    if (action && !validActions.includes(action)) {
      return resp.setError(StatusCodes.BAD_REQUEST, "Invalid action").send(res);
    }

    // if action is not provided or action is "publish"
    // attempt to publish the entry
    if (!action || action === "publish") {
      const entry = await Entry.findOne({
        _id: entry_id,
        user: user_id,
        permanently_deleted: { $in: [false, undefined, null] },
      }).select("-__v -user +deleted");

      if (!entry) {
        return resp
          .setError(StatusCodes.NOT_FOUND, "Entry not found")
          .send(res);
      }

      if (entry.deleted) {
        return resp
          .setError(StatusCodes.FORBIDDEN, "Cannot publish a deleted entry")
          .send(res);
      }

      if (entry.published) {
        return resp
          .setError(StatusCodes.BAD_REQUEST, "Entry already published")
          .send(res);
      }

      entry.published = true;
      await entry.save();
      resp
        .setSuccess(StatusCodes.OK, entry, "Entry published successfully")
        .send(res);

      if (entry.no_of_likes > 0) {
        await Likes.updateMany(
          { entry: entry._id },
          { $set: { entry_unpublished: false, entry_deleted: false } }
        );
        console.log("SUCCESS LIKES AFTER PUBLISHING ENTRY");
      }

      // Update the user's no_of_published_entries everytime a new entry is published
      const userToUpdate = await User.findById(user_id);
      if (userToUpdate) {
        userToUpdate.no_of_published_entries += 1;
        if (entry.no_of_likes) {
          userToUpdate.no_of_likes += entry.no_of_likes;
        }
        userToUpdate.save();
      }

      console.log("SUCCESS UPDATING USERS AFTER PUBLISH");

      return;
    }

    // if action is "unpublish"
    // attempt to unpublish the entry
    if (action === "unpublish") {
      const entry = await Entry.findOne({
        _id: entry_id,
        user: user_id,
      }).select("-__v -user");

      if (!entry) {
        return resp
          .setError(StatusCodes.NOT_FOUND, "Entry not found")
          .send(res);
      }

      if (!entry.published) {
        return resp
          .setError(StatusCodes.BAD_REQUEST, "Entry already is not published")
          .send(res);
      }

      entry.published = false;
      await entry.save();
      resp
        .setSuccess(StatusCodes.OK, entry, "Entry unpublished successfully")
        .send(res);

      // Update the user's no_of_published_entries everytime a new entry is unpublished
      const userToUpdate = await User.findById(user_id);
      if (userToUpdate) {
        userToUpdate.no_of_published_entries -= 1;
        userToUpdate.no_of_likes -= entry.no_of_likes;
        userToUpdate.save();
      }

      console.log("SUCCESS UPDATING USER AFTER UNPUBLISHING");

      await Likes.updateMany(
        { entry: entry._id },
        { $set: { entry_unpublished: true } }
      );

      console.log("SUCCESS UPDATING LIKES AFTER UNPUBLISHING");

      return;
    }
  }
);
