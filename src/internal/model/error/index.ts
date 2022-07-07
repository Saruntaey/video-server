import { BaseError } from "./base-error"
import { ErrorCode } from "./error-code"
import { ErrorType } from "./error-type"

export type InvalidArgDetail = {
  field: string
  detail: string
}

export class NotFoundErr extends BaseError {
  constructor(public detail: string = "resource not found") {
    super(detail, ErrorType.NotFound, ErrorCode.NotFound)
  }
}

export class InvalidArgErr extends BaseError {
  constructor(public detail: InvalidArgDetail[] = []) {
    super(detail, ErrorType.InvalidArg, ErrorCode.InvalidArg)
  }
}

export class InternalErr extends BaseError {
  constructor(public detail: string = "internal error") {
    super(detail, ErrorType.Internal, ErrorCode.Internal)
  }
}

export { BaseError, ErrorCode }
