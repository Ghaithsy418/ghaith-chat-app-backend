/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import AppError from '../utils/appError.js';

export interface ChatRoomSchemaTypes extends Document {
  firstUser: Types.ObjectId;
  secondUser: Types.ObjectId;
  messages: Types.ObjectId[];
}

export const chatRoomSchema = new mongoose.Schema(
  {
    firstUser: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
    secondUser: {
      type: Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    id: false,
    timestamps: true,
  }
);

chatRoomSchema.virtual('messages', {
  ref: 'Message',
  foreignField: 'chatRoomId',
  localField: '_id',
});

chatRoomSchema.pre('save', async function (next) {
  const room = await mongoose.model('ChatRoom').findOne({
    $or: [
      { firstUser: this.firstUser, secondUser: this.secondUser },
      { firstUser: this.secondUser, secondUser: this.firstUser },
    ],
  });

  if (room)
    return next(
      new AppError("Can't make a second room for the same users", 409)
    );

  next();
});

const ChatRoom = mongoose.model<ChatRoomSchemaTypes>(
  'ChatRoom',
  chatRoomSchema,
  'chatRoom'
);

export default ChatRoom;
