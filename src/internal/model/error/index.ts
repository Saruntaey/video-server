import { BaseError } from "./base-error"
import { ErrorCode } from "./error-code"

export class NotFoundErr extends BaseError {
  constructor(public detail: string = "resource not found") {
    super(detail, ErrorCode.NotFound)
  }
}

export class InvalidArgErr extends BaseError {
  constructor(public detail: string = "invalid argument") {
    super(detail, ErrorCode.InvalidArg)
  }
}

export { BaseError, ErrorCode }
