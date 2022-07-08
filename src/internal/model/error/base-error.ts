import { ErrorCode } from "./error-code"
import { ErrorType } from "./error-type"

export abstract class BaseError extends Error {
  constructor(
    public detail: any,
    public type: ErrorType,
    public code: ErrorCode,
  ) {
    super(typeof detail === "string" ? detail : JSON.stringify(detail))
  }

  get response() {
    return {
      type: this.type,
      detail: this.detail,
    }
  }
}
