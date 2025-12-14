export default class AppError extends Error {
  private statusCode: number;
  private status: string;
  public isOperational: boolean = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;

    this.status = String(statusCode).startsWith("4") ? "fail" : "error";

    Error.captureStackTrace(this, this.constructor);
  }
}
