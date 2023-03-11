import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import Likes from '../model/likesModel';
import Entry from '../../entries/model/entriesModel';
import User from '../../users/model/userModel';
import catchController from '../../utils/catchControllerAsyncs';
import createPageInfo from '../../utils/createPagination';
import ResponseStatus from '../../utils/response';
const resp = new ResponseStatus();

export const handleLikes = catchController(
  async (req: Request, res: Response) => {
    const liked_by = req.user._id;

    const entry_id: undefined | string = req.body.entry_id;
    const action: 'like' | 'unlike' | undefined = req.body.action;

    if (!entry_id) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Entry id is required')
        .send(res);
    }

    if (!action || !['like', 'unlike'].includes(action)) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Action is required')
        .send(res);
    }

    const entry = await Entry.findOne({ _id: entry_id, deleted: false });

    if (!entry) {
      return resp
        .setError(
          StatusCodes.NOT_FOUND,
          `We are sorry. Can't seem to find that entry`
        )
        .send(res);
    }

    if (!entry.published) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Cannot like an unpubilished entry')
        .send(res);
    }

    const isLiked = await Likes.findOne({ entry: entry_id, liked_by });

    if (action === 'unlike') {
      if (!isLiked) {
        return resp
          .setError(StatusCodes.FORBIDDEN, 'Entry is not liked')
          .send(res);
      }
      // reduce no of likes of entry by 1 and remove user id from the liked_by array in the entry
      if (entry.no_of_likes > 0) {
        entry.no_of_likes -= 1;
        await entry.save();
      }

      // delete the like from the likes collection

      entry.isLiked = false;

      resp
        .setSuccess(StatusCodes.OK, entry, 'Entry unliked successfully')
        .send(res);

      await Likes.findOneAndDelete({ entry_id, liked_by });

      // reduce the no of likes of the user by 1
      await User.findByIdAndUpdate(
        entry.user._id,
        { $inc: { no_of_likes: -1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        liked_by,
        { $inc: { no_of_likes_given: -1 } },
        { new: true }
      );

      return;
    }

    if (action === 'like') {
      if (isLiked) {
        return resp
          .setError(StatusCodes.BAD_REQUEST, 'Entry already liked')
          .send(res);
      }
      // if the entry is not liked by the user, then add the like to the likes collection
      await Likes.create({
        entry: entry_id,
        liked_by,
        owner: entry.user._id,
      });

      entry.no_of_likes += 1;
      await entry.save();

      entry.isLiked = true;
      resp
        .setSuccess(StatusCodes.OK, entry, 'Entry liked successfully')
        .send(res);

      // for future reference, if we want to add the user id to the liked_by array in the entry
      // $push: { liked_by: liked_by },

      await User.findByIdAndUpdate(
        entry.user._id,
        { $inc: { no_of_likes: 1 } },
        { new: true }
      );

      await User.findByIdAndUpdate(
        liked_by,
        { $inc: { no_of_likes_given: 1 } },
        { new: true }
      );
    }
  }
);

export const getLikesPerUser = catchController(
  async (req: Request, res: Response) => {
    const user_name: string | undefined = req.params.user_id;
    console.log('HIT');
    let user_id: string;
    if (user_name) {
      const user = await User.findOne({ user_name });
      if (!user) {
        return resp.setError(StatusCodes.NOT_FOUND, 'User not found').send(res);
      }
      user_id = user._id;
    } else {
      user_id = req.user._id;
    }

    if (req.query.page && typeof req.query.page != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Page must be a string')
        .send(res);
    }
    if (req.query.limit && typeof req.query.limit != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Limit must be a string')
        .send(res);
    }
    if (req.query.sort && typeof req.query.sort != 'string') {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'Sort must be a string')
        .send(res);
    }

    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    //  const  sort = req.query.sort ? req.query.sort.split(',').join(' ') : '-createdAt';

    const startIndex = (page - 1) * limit;

    interface ISearchObj {
      liked_by: string;
      entry_deleted: { $in: (boolean | undefined | null)[] };
      entry_unpublished: { $in: (boolean | undefined | null)[] };
    }

    const searchObj: ISearchObj = {
      liked_by: user_id,
      entry_deleted: { $in: [false, undefined, null] },
      entry_unpublished: { $in: [false, undefined, null] },
    };

    const totalDocuments = await Likes.countDocuments(searchObj);

    const pageInfo = createPageInfo({
      page,
      limit,
      startIndex,
      totalDocuments,
    });

    const likes = await Likes.find(searchObj)
      .select('-__v -updatedAt')
      .limit(limit)
      .skip(startIndex);

    return resp
      .setSuccess(
        StatusCodes.OK,
        { likes, pageInfo },
        'Likes retrieved successfully'
      )
      .send(res);
  }
);
