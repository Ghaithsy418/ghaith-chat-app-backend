/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import mongoose from 'mongoose';
import { routesProtecter } from '../middlewares/protectingRoutes.js';
import { userImage, userImageResize } from '../middlewares/uploadUserImage.js';
import ChatRoom from '../models/chatRoomModel.js';
import User from '../models/userModel.js';
import AppError from '../utils/appError.js';
import { createPhotoUrl } from '../utils/createPhotoUrl.js';
import {
  Controller,
  Get,
  Patch,
  Post,
} from '../utils/decorators/routesDecorators.js';

@Controller('/api/v1/')
export default class UserController {
  @Patch('users', routesProtecter, userImage.single('image'), userImageResize)
  public async updateProfile(req: Request, res: Response) {
    const { id } = res.locals.user;

    if (req.file) req.body.image = createPhotoUrl(req.file.filename);

    delete req.body.email;
    delete req.body.password;

    try {
      const oldUser = await User.findByIdAndUpdate(id, req.body, {
        runValidators: true,
      }).select('-__v ');

      const dataToSend = { ...oldUser?.toObject(), ...req.body };

      res.status(200).json({
        status: 'success',
        data: dataToSend,
        message: 'Updated Successfully!',
      });

      if (req.file && oldUser?.image) {
        if (oldUser.image !== req.file.filename) {
          fs.unlink(`public/images/${oldUser.image}`, (err) => {
            if (err) console.error('Background delete failed: ', err);
          });
        }
      }
    } catch (err) {
      if (req.file) fs.unlink(`public/images/${req.file.filename}`, () => {});
      throw err;
    }
  }

  @Get('user-profile', routesProtecter)
  public async getUserProfile(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = res.locals.user;

    const infos = await User.findOne({ _id: id });

    if (!infos)
      return next(
        new AppError('Something went wrong when getting the profile!', 500)
      );

    res.status(200).json({
      status: 'success',
      data: infos,
    });
  }

  @Post('search-user', routesProtecter)
  public async searchUser(req: Request, res: Response, next: NextFunction) {
    const { username } = req.body;
    const { username: myUsername } = res.locals.user;

    if (!username) next(new AppError('Username is required', 400));

    if (username === myUsername)
      return next(new AppError("You can't search yourself", 400));

    const user = await User.findOne({ username });

    res.status(200).json({
      status: 'success',
      data: user,
    });
  }

  @Post('add-friend', routesProtecter)
  public async addFriend(req: Request, res: Response, next: NextFunction) {
    const { id, username: myUsername } = res.locals.user;
    const { username } = req.body;

    if (!username) return next(new AppError('Username is required', 400));

    if (username === myUsername)
      return next(new AppError("You can't add yourself :)", 400));

    const user = await User.findOne({ username }).select('_id');

    if (!user)
      return next(new AppError('User not found with this username', 404));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [me, myFriend] = await Promise.allSettled([
        User.findOneAndUpdate(
          { _id: id },
          {
            $push: { friends: { user: user._id, accepted: false } },
          }
        ),
        User.findOneAndUpdate(
          { _id: user._id },
          { $push: { friends: { user: id, accepted: false } } }
        ),
      ]);

      if (!me) {
        await session.abortTransaction();
        return next(new AppError("Couldn't find the friend request", 404));
      }
      if (!myFriend) {
        await session.abortTransaction();
        return next(
          new AppError("Couldn't find the friend's user profile", 404)
        );
      }

      res.status(201).json({
        status: 'success',
        message: 'Friend Request has been sent successfully',
      });
    } catch {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  @Get('sent-requests', routesProtecter)
  public async showSentRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = res.locals.user;

    const me = await User.findOne({ _id: id }).select('friends');

    if (!me) return next(new AppError('User not found', 404));

    const requests = me.friends.filter((friend) => !friend.accepted);

    res.status(200).json({
      status: 'success',
      data: requests,
    });
  }

  @Post('accept-friend-request', routesProtecter)
  public async acceptFriendRequest(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    const { id } = res.locals.user;
    const { userId } = req.body;

    if (!userId) return next(new AppError('UserId is required', 400));

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const [currentUser, friendUser] = await Promise.allSettled([
        User.findOneAndUpdate(
          {
            _id: id,
            'friends.user': userId,
          },
          {
            $set: { 'friends.$.accepted': true },
          },
          { new: true, session }
        ),
        User.findOneAndUpdate(
          {
            _id: userId,
            'friends.user': id,
          },
          {
            $set: { 'friends.$.accepted': true },
          },
          { new: true, session }
        ),
      ]);

      if (!currentUser) {
        await session.abortTransaction();
        return next(new AppError("Couldn't find the friend request", 404));
      }
      if (!friendUser) {
        await session.abortTransaction();
        return next(
          new AppError("Couldn't find the friend's user profile", 404)
        );
      }

      const newRoom = await ChatRoom.create(
        [
          {
            firstUser: id,
            secondUser: userId,
          },
        ],
        { session }
      );

      if (!newRoom) {
        await session.abortTransaction();
        session.endSession();
        return next(
          new AppError('Something went wrong please try again!', 500)
        );
      }

      await session.commitTransaction();

      res.status(200).json({
        status: 'success',
        message: 'Friend request accepted successfully',
        data: newRoom[0],
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
