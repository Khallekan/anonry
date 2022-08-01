import User from "../../users/model/userModel";
import Entry from "../model/entriesModel";
import Tags from "../../tags/model";
import catchController from "../../utils/catchControllerAsyncs";
import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import ResponseStatus from "../../utils/response";

const resp = new ResponseStatus();

export const getMyEntries = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    if (!user_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, "User id is required")
        .send(res);
    }
    const entries = await Entry.find({ user: user_id, deleted: false });

    return resp
      .setSuccess(StatusCodes.OK, entries, "Entries fetched successfully")
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
      return resp.setError(StatusCodes.BAD_REQUEST, "All fields are required");
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
      return resp.setError(StatusCodes.BAD_REQUEST, "Maximum 5 tags allowed");
    }
    if (tags && tags.length <= 5) {
      // check if Tags exist
      const tagsExist = await Tags.find({ name: { $in: tags } });

      if (tagsExist.length !== tags.length) {
        return resp
          .setError(StatusCodes.NOT_FOUND, "Some tags do not exist")
          .send(res);
      }
      entryDetails.tags = tags;
    }

    const entry = await Entry.create(entryDetails);

    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry created successfully")
      .send(res);
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

    return resp
      .setSuccess(StatusCodes.OK, entry, "Entry updated successfully")
      .send(res);
  }
);

export const deleteEntry = catchController(
  async (req: Request, res: Response, next: NextFunction) => {
    const user_id: string = req.body.user._id;
    const entry_id: string = req.body.entry_id;
    if (!entry_id) {
      return resp.setError(StatusCodes.BAD_REQUEST, "Entry id is required");
    }

    const entry = await Entry.findOneAndUpdate(
      { _id: entry_id, user: user_id },
      { deleted: true },
      { new: true }
    );

    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, "Entry not found");
    }

    // Update the user's no_of_entries everytime a new entry is deleted
    const user = await User.findById(user_id);
    if (user) {
      user.no_of_entries = user.no_of_entries - 1;
      user.save();
    }

    return resp
      .setSuccess(StatusCodes.OK, [], "Entry deleted successfully")
      .send(res);
  }
);
