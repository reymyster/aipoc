import { HttpApp } from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Effect, Layer, Logger } from "effect";
import { RpcHello } from "@/lib/api";

// 👇 Example of added custom logger (as `Layer`)
export const LoggerLayer = Logger.add(
  Logger.make(({ logLevel, message }) => {
    globalThis.console.log(`[${logLevel.label}] ${message}`);
  })
);

const RpcHelloLayer = RpcHello.toLayer({
  HelloRequest: (params) =>
    Effect.gen(function* () {
      yield* Effect.log(params.name);
      return `Hello, ${params.name}!`;
    }),
}).pipe(Layer.provide(LoggerLayer));

export const RpcWebHandler = RpcServer.toHttpApp(RpcHello).pipe(
  // 👇 Convert to `Request`/`Response` handler
  Effect.map(HttpApp.toWebHandler),
  Effect.provide([RpcHelloLayer, RpcSerialization.layerNdjson])
);

export async function POST(request: Request) {
  return await Effect.runPromise(
    Effect.scoped(
      RpcWebHandler.pipe(
        // invoke the web handler as an Effect
        Effect.flatMap((handler) => Effect.promise(() => handler(request)))
      )
    )
  );
}
