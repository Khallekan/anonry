import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Bookmark from '../model/bookmarkModel';
import Entry from '../../entries/model/entriesModel';
import User from '../../users/model/userModel';
import catchController from '../../utils/catchControllerAsyncs';
import { createPageData } from '../../utils/createPagination';
import ResponseStatus from '../../utils/response';

const resp = new ResponseStatus();

export const createBookmark = catchController(
  async (req: Request, res: Response) => {
    const user_id: string = req.user._id;
    const entry_id: string | undefined = req.body.entry_id;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Entry id is required')
        .send(res);
    }

    const entry = await Entry.findById(entry_id);
    if (!entry) {
      return resp.setError(StatusCodes.NOT_FOUND, 'Entry not found').send(res);
    }

    // check if the entry is already bookmarked
    const isBookMarked = await Bookmark.findOne({
      entry: entry_id,
      bookmarked_by: user_id,
    });

    if (isBookMarked) {
      return resp
        .setError(StatusCodes.CONFLICT, 'Entry already added to bookmarks')
        .send(res);
    }

    const bookmark = await Bookmark.create({
      bookmarked_by: user_id,
      entry: entry_id,
      tags: entry.tags,
      published_by: entry.user._id,
    });

    if (!bookmark) {
      return resp
        .setError(StatusCodes.INTERNAL_SERVER_ERROR, 'Error creating bookmark')
        .send(res);
    }

    resp
      .setSuccess(
        StatusCodes.CREATED,
        bookmark,
        'Bookmark created successfully'
      )
      .send(res);

    // Update the user's no_of_bookmarks everytime a new bookmark is created
    await User.findByIdAndUpdate(user_id, {
      $inc: { no_of_bookmarks: 1 },
    });

    console.log(`<-----User ${user_id} bookmarked entry ${entry_id}---->`);
  }
);

export const getBookmarks = catchController(
  async (req: Request, res: Response) => {
    const user_id: string = req.user._id;

    if (!user_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'User id is required')
        .send(res);
    }

    if (req.query.page && typeof req.query.page != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid page number')
        .send(res);
    }

    if (req.query.limit && typeof req.query.limit != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid limit number')
        .send(res);
    }

    if (req.query.sort && typeof req.query.sort != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid sort field')
        .send(res);
    }

    if (req.query.tags && typeof req.query.tags != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Invalid tags field')
        .send(res);
    }

    const page: number = req.query.page ? parseInt(req.query.page) : 1;
    const limit: number = req.query.limit ? parseInt(req.query.limit) : 20;
    const sort: string = req.query.sort
      ? req.query.sort.split(',').join(' ')
      : 'createdAt';

    // const startIndex = (page - 1) * limit;
    const searchBy: {
      tags?: { $in: string[] };
      bookmarked_by: string;
    } = {
      bookmarked_by: user_id,
    };

    if (req.query.tags) {
      searchBy.tags = { $in: req.query.tags.split(',') };
    }

    const bookmarks = await Bookmark.paginate(searchBy, {
      limit,
      page,
      sort,
      select: '-__v -updatedAt',
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
    } = bookmarks;

    const pageInfo = createPageData({
      page,
      totalPages,
      totalHits: totalHits as number,
      hasNextPage,
      hasPrevPage,
      nextPage,
      prevPage,
    });

    return resp
      .setSuccess(
        StatusCodes.OK,
        { data, pageInfo },
        'Bookmarks retrieved successfully'
      )
      .send(res);
  }
);

export const removeBookmark = catchController(
  async (req: Request, res: Response) => {
    const user_id: string = req.user._id;
    const bookmark_id: string | undefined = req.params.id;

    if (!bookmark_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Bookmark id is required')
        .send(res);
    }

    const bookmark = await Bookmark.findById(bookmark_id);
    if (
      !bookmark ||
      !bookmark.bookmarked_by ||
      typeof bookmark.bookmarked_by === 'string'
    ) {
      return resp
        .setError(StatusCodes.NOT_FOUND, 'Bookmark not found')
        .send(res);
    }

    if (bookmark.bookmarked_by._id.toString() !== user_id.toString()) {
      return resp
        .setError(
          StatusCodes.FORBIDDEN,
          'You are not allowed to delete this bookmark'
        )
        .send(res);
    }

    await Bookmark.deleteOne({ _id: bookmark_id });

    resp
      .setSuccess(StatusCodes.OK, {}, 'Bookmark deleted successfully')
      .send(res);

    // Update the user's no_of_bookmarks everytime a bookmark is deleted
    await User.findByIdAndUpdate(user_id, {
      $inc: { no_of_bookmarks: -1 },
    });
  }
);
