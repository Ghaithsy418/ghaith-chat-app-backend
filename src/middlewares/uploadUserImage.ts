import { NextFunction, Request, Response } from 'express';
import multer, { FileFilterCallback } from 'multer';
import sharp from 'sharp';
import AppError from '../utils/appError.js';

const storage = multer.memoryStorage();

const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  if (file?.mimetype.startsWith('image')) return cb(null, true);
  return cb(new AppError('You can just upload images!!', 400));
};

export const userImage = multer({ fileFilter: imageFilter, storage });

export const userImageResize = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (!req.file) return next();

  const { id } = res.locals.user;

  const imageName = `user-${id}-${Date.now()}.jpeg`;
  req.file.filename = imageName;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/images/${imageName}`);

  next();
};
