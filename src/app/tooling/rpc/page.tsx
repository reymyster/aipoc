"use client";

import { FetchHttpClient } from "@effect/platform";
import { RpcClient, RpcSerialization } from "@effect/rpc";
import { Effect, Layer } from "effect";
import { useCallback, useEffect, useState } from "react";
import { RpcHello } from "@/lib/api";

const ProtocolLive = RpcClient.layerProtocolHttp({
  url: "/api/rpc",
}).pipe(Layer.provide([FetchHttpClient.layer, RpcSerialization.layerNdjson]));

export class RpcHelloClient extends Effect.Service<RpcHelloClient>()(
  "RpcHelloClient",
  {
    dependencies: [ProtocolLive],
    scoped: RpcClient.make(RpcHello),
  }
) {}
const main = Effect.gen(function* () {
  console.log("entering main");
  const client = yield* RpcHelloClient;

  console.log("yielded client");

  const response = yield* client
    .HelloRequest({ name: "Tester" })
    .pipe(Effect.tapError((err) => Effect.log(JSON.stringify(err))));

  console.log(`yielded client response ${response}`);

  return response;
}).pipe(Effect.provide(RpcHelloClient.Default));

export default function Page() {
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    console.log("Entering load");
    const response = await Effect.runPromise(main);
    console.log(`Response: ${response}`);
    setRes(response);
    setLoading(false);
  }, []);

  useEffect(() => {
    console.log("Calling load");
    load();
  }, [load]);

  return (
    <div>
      {loading && <div>Loading...</div>}
      <div>Response --{res}--</div>
    </div>
  );
}
