import { Rpc, RpcGroup } from "@effect/rpc";
import { Schema } from "effect";

class RequestError extends Schema.Class<RequestError>("RequestError")({
  errorMessage: Schema.String,
}) {}

export class RpcHello extends RpcGroup.make(
  Rpc.make("HelloRequest", {
    error: RequestError,
    success: Schema.NonEmptyString,
    payload: {
      name: Schema.NonEmptyString,
    },
  })
) {}
