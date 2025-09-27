import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Layer } from "effect";

export const RpcProtocolLive = RpcClient.layerProtocolHttp({
  url: "/api/rpc",
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));
