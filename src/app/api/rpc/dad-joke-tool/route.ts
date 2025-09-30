import { LanguageModel } from "@effect/ai";
import {
  OpenRouterClient,
  OpenRouterLanguageModel,
} from "@effect/ai-openrouter";
import { FetchHttpClient, HttpApp, HttpClient } from "@effect/platform";
import { RpcSerialization, RpcServer } from "@effect/rpc";
import { Config, Effect, Layer, Logger } from "effect";
import { RpcDadJoke } from "@/lib/api/dadjoketool/rpc-definition";
import { DadJokeToolHandlers, DadJokeTools } from "@/lib/api/dadjoketool/tool";

const LoggerLayer = Logger.add(
  Logger.make(({ logLevel, message }) => {
    globalThis.console.log(`[${logLevel.label}] ${message}`);
  })
);

const OpenRouter = OpenRouterClient.layerConfig({
  apiKey: Config.redacted("OPENROUTERAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer));

const OpenRouterModel = OpenRouterLanguageModel.model(
  "google/gemini-2.5-flash"
);

const RpcDadJokeLayer = RpcDadJoke.toLayer({
  GetDadJoke: (params) =>
    Effect.gen(function* () {
      yield* Effect.log(`GetDadJoke params.topic: ${params.topic}`);

      const response = yield* LanguageModel.generateText({
        prompt: `Generate a dad joke about ${params.topic}`,
        toolkit: DadJokeTools,
      }).pipe(
        Effect.provide([OpenRouterModel, OpenRouter, DadJokeToolHandlers]),
        Effect.catchAll((error) =>
          Effect.succeed(`Recovering from error ${error.toString()}`)
        )
      );

      if (typeof response === "string") {
        yield* Effect.log(`Response as string: --${response}--`);
      } else {
        yield* Effect.log(
          `Response as text: --${response.text}--, ${JSON.stringify(response)}`
        );
      }

      return typeof response === "string"
        ? response || "Empty response string"
        : response.content.findLast((_) => true)?.["result"] ??
            "Empty response text";
    }),
}).pipe(Layer.provide([LoggerLayer, FetchHttpClient.layer, OpenRouter]));

const RpcWebHandler = RpcServer.toHttpApp(RpcDadJoke).pipe(
  Effect.map(HttpApp.toWebHandler),
  Effect.provide([
    RpcDadJokeLayer,
    RpcSerialization.layerNdjson,
    FetchHttpClient.layer,
  ])
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
