import { Rpc, RpcClient, RpcGroup } from "@effect/rpc";
import { Effect, Schema } from "effect";
import { RpcProtocolLive } from "./client-layers";

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

export class RpcHelloClient extends Effect.Service<RpcHelloClient>()(
  "RpcHelloClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(RpcHello),
  }
) {}
