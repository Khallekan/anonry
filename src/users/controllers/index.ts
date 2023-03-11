import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

import User from '../model/userModel';
import Entries from '../../entries/model/entriesModel';
import Likes from '../../likes/model/likesModel';
import catchController from '../../utils/catchControllerAsyncs';
import ResponseStatus from '../../utils/response';
const resp = new ResponseStatus();

export const editUser = catchController(async (req: Request, res: Response) => {
  const user_id = req.user._id;
  const {
    avatar,
    user_name,
  }: { avatar: string | undefined; user_name: string | undefined } = req.body;

  const user = await User.findById(user_id);

  if (!user) {
    return resp.setError(StatusCodes.NOT_FOUND, 'User not found').send(res);
  }

  if (avatar && typeof avatar !== 'string') {
    return resp
      .setError(StatusCodes.BAD_REQUEST, 'Avatar must be a string')
      .send(res);
  }

  if (avatar && typeof avatar === 'string') {
    const validAvatar = avatar.startsWith('https://robohash.org');

    if (!validAvatar) {
      return resp.setError(StatusCodes.BAD_REQUEST, 'Invalid avatar').send(res);
    }
    user.avatar = avatar;
  }

  if (user_name && typeof user_name !== 'string') {
    return resp
      .setError(StatusCodes.BAD_REQUEST, 'User name must be a string')
      .send(res);
  }

  if (user_name && typeof user_name === 'string') {
    // check if user name is already taken
    const newUserName = user_name.toLowerCase().trim();

    // if username contains spaces
    if (newUserName.includes(' ')) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'User name cannot contain spaces')
        .send(res);
    }
    const userWithSameName = await User.findOne({
      user_name: newUserName,
    });

    if (userWithSameName) {
      return resp
        .setError(StatusCodes.BAD_REQUEST, 'User name already taken')
        .send(res);
    }

    user.user_name = newUserName;
  }

  await user.save();

  return resp
    .setSuccess(StatusCodes.OK, user, 'User updated successfully')
    .send(res);
});

// delete user

export const deleteUser = catchController(
  async (req: Request, res: Response) => {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return resp.setError(StatusCodes.NOT_FOUND, 'User not found').send(res);
    }

    if (user.deleted) {
      return resp
        .setError(
          StatusCodes.NOT_FOUND,
          'Account has already been permanently deleted'
        )
        .send(res);
    }

    await Entries.updateMany(
      { user: user._id },
      { deleted: true, permanentlyDeleted: true, published: false },
      { new: true }
    );

    await Likes.deleteMany({ owner: user._id });
  }
);
