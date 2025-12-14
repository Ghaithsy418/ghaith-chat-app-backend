/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';

export interface MessageSchemTypes extends Document {
  content: string;
  sender: Types.ObjectId;
  chatRoomId: Types.ObjectId;
}

export const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
    },
    sender: {
      type: Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender is required'],
    },
    chatRoomId: {
      type: Types.ObjectId,
      ref: 'ChatRoom',
      required: [true, 'ChatRoom id is required'],
      index: true,
    },
  },
  { timestamps: true, id: false }
);

messageSchema.pre(/^find/, function (next) {
  (this as any).populate({
    path: 'sender',
    select: 'firstName middleName lastName image',
  });
  next();
});

export const Message = mongoose.model<MessageSchemTypes>(
  'Message',
  messageSchema,
  'message'
);
