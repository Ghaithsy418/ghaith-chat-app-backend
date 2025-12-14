/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorRequestHandler, Response } from "express";
import { ErrorHandlers } from "../utils/errorHandlers.js";

const sendErrorDev = (err: any, res: Response) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err: any, res: Response) => {
  if (err.isOperational)
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  else {
    res.status(500).json({
      status: "error",
      message: "Something went wrong!",
    });
  }
};

export const globalErrorHandler: ErrorRequestHandler = (
  err,
  _req,
  res,
  next
) => {
  // Destructring the handlers
  const {
    handlingCastError,
    handlingDuplicateValue,
    handlingInvalidToken,
    handlingValidationError,
  } = ErrorHandlers;

  // Performing the Logic
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let errorCopy = { ...err };

    if (err.name === "CastError") errorCopy = handlingCastError(errorCopy);
    if (err.code === 11000) errorCopy = handlingDuplicateValue(errorCopy);
    if (err.name === "ValidationError")
      errorCopy = handlingValidationError(errorCopy);
    if (err.name === "JsonWebTokenError") errorCopy = handlingInvalidToken();

    sendErrorProd(errorCopy, res);
  }

  next();
};
