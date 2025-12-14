import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';
import AppError from '../utils/appError.js';

export const signinSchema = z.object({
  email: z.email('Please enter a valid email'),
  password: z
    .string('Password is required')
    .min(8, 'Password should contain at least 8 characters'),
});

export type SigninInput = z.infer<typeof signinSchema>;

export const validateSignin = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const validationResult = signinSchema.safeParse(req.body);

  if (!validationResult.success) {
    const validationError = fromZodError(validationResult.error, {
      prefix: 'Validation failed',
      issueSeparator: ' \n- ',
      includePath: false,
    });

    return next(new AppError(validationError.message, 400));
  }

  req.body = validationResult.data;
  next();
};
