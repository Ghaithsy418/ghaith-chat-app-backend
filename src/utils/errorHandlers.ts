/* eslint-disable @typescript-eslint/no-explicit-any */
import AppError from "./appError.js";

class ErrorHandlersClass {
  public handlingCastError = (err: any) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
  };

  public handlingDuplicateValue = (err: any) => {
    const value = Object.values(err.keyValue);

    const message = `Duplicate field value "${value}" Please use another value!`;
    return new AppError(message, 400);
  };

  public handlingValidationError = (err: any) => {
    const value = Object.values(err.errors as Error).map(
      (error) => error.message
    );
    const message = `Validation Error ${value.join(". ")}`;

    return new AppError(message, 400);
  };

  public handlingInvalidToken = () => {
    return new AppError("This token is invalid please log in again!", 401);
  };
}

export const ErrorHandlers = new ErrorHandlersClass();
