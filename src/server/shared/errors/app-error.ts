export class AppError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status = 500, code = "internal_error") {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
  }
}
