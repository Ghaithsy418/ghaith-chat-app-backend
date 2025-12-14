import mongoose from 'mongoose';

export const friendSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Types.ObjectId,
      ref: 'User',
      required: [true, 'Friend id is required'],
    },
    accepted: {
      type: Boolean,
      required: [true, 'Accepted state is required'],
    },
  },

  { id: false }
);
