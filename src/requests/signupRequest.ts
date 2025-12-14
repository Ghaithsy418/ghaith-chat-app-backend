import { NextFunction, Request, Response } from 'express';
import z from 'zod';
import { fromZodError } from 'zod-validation-error';
import AppError from '../utils/appError.js';

export const signupSchema = z.object({
  firstName: z.string('First Name is required'),
  middleName: z.string().optional(),
  lastName: z.string('Last Name is required'),
  email: z.email('Please enter a valid email'),
  password: z
    .string('Password is required')
    .min(8, 'Password should contain at least 8 characters'),
  passwordConfirm: z.string('Please confirm your password'),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const validateSignup = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const validationResult = signupSchema.safeParse(req.body);

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
