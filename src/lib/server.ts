import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { FetchHttpClient } from "@effect/platform";
import {
  Config,
  Effect,
  Layer,
  Logger,
  LogLevel,
  ManagedRuntime,
} from "effect";

const OpenAiConfig = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENAI_API_KEY"),
});

const OpenAI = OpenAiLanguageModel.model("gpt-5", {
  reasoning: {
    effort: "minimal",
  },
}).pipe(
  Effect.provide(OpenAiConfig),
  Effect.provide(FetchHttpClient.layer),
  Layer.unwrapEffect
);

const LogLevelLive = Config.logLevel("LOG_LEVEL").pipe(
  Config.withDefault(LogLevel.All),
  Effect.andThen((level) => Logger.minimumLogLevel(level)),
  Layer.unwrapEffect
);

export const MainLayer = Layer.mergeAll(OpenAI, LogLevelLive, Logger.pretty);
export const Runtime = ManagedRuntime.make(MainLayer);
