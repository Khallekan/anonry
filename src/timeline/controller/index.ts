import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { HydratedDocument, Types } from 'mongoose';

import { IEntry, ILikesModel } from '../../common/types';
import Entry from '../../entries/model/entriesModel';
import Likes from '../../likes/model/likesModel';
import Tags from '../../tags/model/tagsModel';
import catchController from '../../utils/catchControllerAsyncs';
import createPageInfo from '../../utils/createPagination';
import ResponseStatus from '../../utils/response';

const resp = new ResponseStatus();

const checkIfLiked = (
  likes: HydratedDocument<ILikesModel>[],
  entries: HydratedDocument<IEntry>[]
) => {
  likes.forEach((like) => {
    const entry = entries.find(
      (entry) => entry._id.toString() === like.entry._id.toString()
    );
    if (entry) {
      entry.isLiked = true;
    }
  });

  return entries;
};

export const getTimeline = catchController(
  async (req: Request, res: Response) => {
    const user_id: Types.ObjectId = req.user._id;
    let tags: string[];

    // If page and limit are of invalid types return error
    if (req.query.page && typeof req.query.page != 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid page number' });
    }
    if (req.query.limit && typeof req.query.limit != 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid limit number' });
    }
    if (req.query.sort && typeof req.query.sort != 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid sort value' });
    }
    if (req.query.tags && typeof req.query.tags != 'string') {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid tags value' });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const sort = req.query.sort
      ? req.query.sort.split(',').join(' ')
      : '-createdAt';

    // calculate the start index of the documents to be returned
    const startIndex = (page - 1) * limit;

    // define the type of the search object
    interface ISearchBy {
      deleted: boolean;
      published: boolean;
      tags?: { $in: Types.ObjectId[] };
    }

    // define parameters to search by
    const searchBy: ISearchBy = {
      deleted: false,
      published: true,
    };

    // if tags are provided, add them to the search object
    if (req.query.tags) {
      tags = req.query.tags.split(',');
      const tagsExist = await Tags.find({ name: { $in: tags } });
      if (tagsExist.length !== tags.length) {
        return resp
          .setError(StatusCodes.NOT_FOUND, 'Some tags do not exist')
          .send(res);
      }
      searchBy.tags = { $in: tagsExist.map((tag) => tag._id) };
    }

    const totalDocuments = await Entry.countDocuments(searchBy);

    let entries: HydratedDocument<IEntry>[] = await Entry.find(searchBy)
      .limit(limit)
      .skip(startIndex)
      .sort(sort)
      .select('-__v');

    const likes = await Likes.find({
      entry: { $in: entries.map((entry) => entry._id) },
      liked_by: user_id,
    });

    if (likes.length) {
      entries = checkIfLiked(likes, entries);
    }

    const pageInfo = createPageInfo({
      page,
      limit,
      startIndex,
      totalDocuments,
    });

    resp
      .setSuccess(
        StatusCodes.OK,
        { entries, pageInfo },
        'Timeline fetched successfully'
      )
      .send(res);
  }
);
