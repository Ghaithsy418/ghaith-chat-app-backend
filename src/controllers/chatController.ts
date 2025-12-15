import { NextFunction, Request, Response } from 'express';
import { Document, Types } from 'mongoose';
import { routesProtecter } from '../middlewares/protectingRoutes.js';
import ChatRoom from '../models/chatRoomModel.js';
import { Message } from '../models/messageModel.js';
import AppError from '../utils/appError.js';
import DataOperations from '../utils/dataOperations.js';
import { Controller, Get, Post } from '../utils/decorators/routesDecorators.js';

interface PopulatedUser {
  _id: Types.ObjectId;
  fullName: string;
  image: string;
}

interface PopulatedChatRoomData {
  _id: Types.ObjectId;
  firstUser: PopulatedUser;
  secondUser: PopulatedUser;
  createdAt: Date;
  updatedAt: Date;
}

type ChatRoomDocument = Document & PopulatedChatRoomData;

@Controller('/api/v1/')
export default class ChatController {
  @Get('get-rooms', routesProtecter)
  public async getRooms(req: Request, res: Response) {
    const { id } = res.locals.user;

    const mongooseQuery = ChatRoom.find({
      $or: [{ firstUser: id }, { secondUser: id }],
    });

    const dataOperations = new DataOperations(
      req.query,
      mongooseQuery,
      ChatRoom
    );

    const paginationOutput = await dataOperations.paginate();

    const rooms = (await dataOperations.mongooseQuery
      .select('-__v -updatedAt -createdAt')
      .populate('firstUser', 'firstName middleName lastName image')
      .populate(
        'secondUser',
        'firstName middleName lastName image'
      )) as unknown as ChatRoomDocument[];

    const formattedRooms = rooms.map((room) => {
      const roomObj = room.toJSON({ virtuals: true }) as ChatRoomDocument;

      const otherUser =
        room.firstUser._id.toString() === id ? room.firstUser : room.secondUser;

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { firstUser, secondUser, ...rest } = roomObj;

      return { ...rest, otherUser };
    });

    res.status(200).json({
      status: 'success',
      data: formattedRooms,
      ...paginationOutput,
    });
  }

  @Post('messages', routesProtecter)
  public async getMessages(req: Request, res: Response, next: NextFunction) {
    const { roomId } = req.body;

    if (!roomId) return next(new AppError('roomId is required', 400));

    const messages = await Message.find({ chatRoomId: roomId });

    res.status(200).json({
      status: 'success',
      data: messages,
    });
  }
}
