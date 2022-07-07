import { ErrorCode } from "./error-code"
import { ErrorType } from "./error-type"

export abstract class BaseError extends Error {
  constructor(
    public detail: any,
    public type: ErrorType,
    public code: ErrorCode,
  ) {
    let message: string
    if (typeof detail === "string") {
      message = detail
    } else {
      message = JSON.stringify(detail)
    }

    super(message)
  }

  get response() {
    return {
      type: this.type,
      detail: this.detail,
    }
  }
}
