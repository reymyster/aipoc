import { OpenAiClient, OpenAiLanguageModel } from "@effect/ai-openai";
import { FetchHttpClient } from "@effect/platform";
import { Config, Effect, Layer, ManagedRuntime } from "effect";

const OpenAiConfig = OpenAiClient.layerConfig({
  apiKey: Config.redacted("OPENAI_API_KEY"),
});

const OpenAI = OpenAiLanguageModel.model("gpt-5-mini", {
  reasoning: {
    effort: "minimal",
  },
}).pipe(
  Effect.provide(OpenAiConfig),
  Effect.provide(FetchHttpClient.layer),
  Layer.unwrapEffect
);

export const MainLayer = Layer.mergeAll(OpenAI);
export const Runtime = ManagedRuntime.make(MainLayer);
