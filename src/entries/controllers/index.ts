import User from "../../users/model/userModel";
import Entry from "../model/entriesModel";
import Tags from "../../tags/model";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { catchController, createPageInfo, ResponseStatus } from "../../utils";

const resp = new ResponseStatus();

export const getMyEntries = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    if (!user_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "User id is required")
        .send(res);
    }

    let limit: number, page: number, totalDocuments: number;

    if (req.query.page && typeof req.query.page != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid page number" });
    }
    if (req.query.limit && typeof req.query.limit != "string") {
      return res
        .status(400)
        .json({ success: false, message: "Invalid limit number" });
    }

    // if the page is defined and of a valid type convert it to number
    // if converted value is not a number assign a default value of 1
    page = req.query.page ? parseInt(req.query.page) : 1;
    // if the limit is defined and of a valid type convert it to number
    // if converted value is not a number assign a default value of 20
    limit = req.query.limit ? parseInt(req.query.limit) : 20;

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    interface ISearchObject {
      user: string;
      deleted: boolean;
    }

    const searchObj: ISearchObject = {
      user: user_id,
      deleted: false,
    };

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
      .sort({ updatedAt: -1 });

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
    const entry = await Entry.findOne({ _id: entry_id, deleted: false }).select(
      "-__v"
    );
    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }
    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry fetched successfully")
      .send(res);
  }
);

export const createEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string | undefined = req.body.user._id;
    const title: string | undefined = req.body.title;
    const description: string | undefined = req.body.description;
    const tags: string[] | undefined = req.body.tags;

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

      console.log(tagsExist);

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
  }
);

export const editEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user.id;
    const entry_id: string = req.body.entry_id;
    const title: string = req.body.title;
    const description: string = req.body.description;

    console.log({ user_id, entry_id, title, description });

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
    const user_id: string = req.body.user._id;
    const entry_id: string | undefined = req.params.id;

    console.log(entry_id);

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    const entry = await Entry.findOneAndUpdate(
      { _id: entry_id, user: user_id },
      { deleted: true },
      { new: true }
    );

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found").send(res);
    }

    // Update the user's no_of_entries everytime a new entry is deleted
    const user = await User.findById(user_id);
    if (user) {
      user.no_of_entries = user.no_of_entries - 1;
      if (entry.published) {
        user.no_of_published_entries = user.no_of_published_entries - 1;
      }
      user.save();
    }

    return resp
      .setSuccess(StatusCodes.OK, [], "Entry deleted successfully")
      .send(res);
  }
);

export const publishEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    const entry_id: string | undefined = req.params.id;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "Entry id is required")
        .send(res);
    }

    const entry = await Entry.findOneAndUpdate(
      {
        _id: entry_id,
        user: user_id,
        published: { $in: [false, undefined, null] },
      },
      { published: true },
      { new: true }
    );

    console.log(entry);

    if (!entry) {
      return resp
        .setError(StatusCodes.NOT_FOUND, "Entry not found or already published")
        .send(res);
    }

    // Update the user's no_of_published_entries everytime a new entry is published
    const user = await User.findById(user_id);
    if (user) {
      user.no_of_published_entries = user.no_of_published_entries + 1;
      await user.save();
    }

    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry published successfully")
      .send(res);
  }
);
