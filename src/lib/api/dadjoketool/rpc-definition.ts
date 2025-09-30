import { FetchHttpClient } from "@effect/platform";
import { Rpc, RpcClient, RpcGroup, RpcSerialization } from "@effect/rpc";
import { Effect, Layer, Schema } from "effect";

export const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: "/api/rpc/dad-joke-tool",
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export class RpcDadJoke extends RpcGroup.make(
  Rpc.make("GetDadJoke", {
    error: Schema.Never,
    success: Schema.NonEmptyString,
    payload: {
      topic: Schema.NonEmptyString,
    },
  })
) {}

export class RpcDadJokeClient extends Effect.Service<RpcDadJokeClient>()(
  "RpcDadJokeClient",
  {
    dependencies: [RpcProtocolLive],
    scoped: RpcClient.make(RpcDadJoke),
  }
) {}
