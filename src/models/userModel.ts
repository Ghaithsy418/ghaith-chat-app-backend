/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Types } from 'mongoose';
import { friendSchema } from './friendModel.js';

interface FriendType {
  userId: Types.ObjectId;
  accepted: boolean;
}

export interface UserSchemaTypes extends Document {
  _id: Types.ObjectId;
  firstName: string;
  middleName: string;
  lastName: string;
  username: string;
  email: string;
  emailVerified: boolean;
  phoneNumber: string;
  image: string;
  bio: string;
  friends: FriendType[];
}

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'First Name is required!'],
    },
    middleName: {
      type: String,
    },
    lastName: {
      type: String,
      required: [true, 'Last Name is required!'],
    },
    username: {
      type: String,
      unique: true,
      required: [true, 'Username is required'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowerCase: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        'Please enter a valid email address',
      ],
    },
    emailVerified: { type: Boolean, default: false },
    image: {
      type: String,
      default: null,
    },
    phoneNumber: {
      type: String,
      match: [/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'],
    },
    bio: {
      type: String,
      default: null,
    },
    friends: [friendSchema],
  },
  {
    timestamps: true,
    id: false,
    toJSON: {
      virtuals: true,
      transform: function (_doc, ret: any) {
        delete ret.firstName;
        delete ret.middleName;
        delete ret.lastName;
        delete ret.id;

        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

userSchema.virtual('fullName').get(function () {
  return [this.firstName, this.middleName, this.lastName]
    .filter(Boolean)
    .join(' ');
});

userSchema.pre(/^find/, function (next) {
  (this as any).populate({
    path: 'friends.user',
    select: '-email -emailVerified -phoneNumber -createdAt -updatedAt -friends',
  });
  next();
});

const User = mongoose.model<UserSchemaTypes>('User', userSchema, 'user');

export default User;
