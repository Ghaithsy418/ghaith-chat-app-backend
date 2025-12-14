/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    ipAddress: String,
    userAgent: String,
  },
  {
    timestamps: true,
  }
);

export const Session = mongoose.model('Session', sessionSchema, 'session');
