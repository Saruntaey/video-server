import { ErrorCode } from "./error-code"

export class BaseError extends Error {
  constructor(public detail: string, public code: ErrorCode) {
    super(detail)
  }
}
