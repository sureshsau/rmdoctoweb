export default class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);

    this.statusCode = statusCode;
    this.isOperational = true; // Marks known/handled errors

    // Capture the stack trace (removes constructor from stack output)
    Error.captureStackTrace(this, this.constructor);
  }
}
