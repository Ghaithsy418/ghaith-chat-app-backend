import { NextFunction, Request, Response } from "express";
import AppError from "../utils/appError.js";

type PermissionsTypes = (
  ...roles: string[]
) => (req: Request, res: Response, next: NextFunction) => void;

export const checkPermissions: PermissionsTypes = (...roles) => {
  // To prevent any unwanted error
  return (req, _res, next) => {
    if (!req?.user)
      return next(
        new AppError(
          "The Permissions middleware should be used after protecting the routes!",
          400
        )
      );

    // Checking the user role
    if (!roles.includes(req?.user.role))
      return next(
        new AppError(
          "You don't have the permission to perform this action!",
          403
        )
      );

    next();
  };
};
