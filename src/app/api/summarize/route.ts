import { LanguageModel } from "@effect/ai";
import {
  OpenRouterClient,
  OpenRouterLanguageModel,
} from "@effect/ai-openrouter";
import { FetchHttpClient } from "@effect/platform";
import { Config, Effect, Layer, Schema } from "effect";

const OpenRouterModels = Schema.Literal(
  "x-ai/grok-4-fast:free",
  "google/gemini-2.5-flash",
  "deepseek/deepseek-chat-v3-0324",
  "openai/gpt-5-mini"
).annotations({
  decodingFallback: (issue) =>
    Effect.gen(function* () {
      yield* Effect.log(issue._tag);
      return yield* Effect.succeed(OpenRouterModels.literals[1]); // default to gemini flash
    }),
});

class RequestInput extends Schema.Class<RequestInput>("RequestInput")({
  change: Schema.NonEmptyString,
  model: OpenRouterModels,
}) {}

class Summary extends Schema.Class<Summary>("Summary")({
  title: Schema.NonEmptyString.annotations({
    description: "short subject line",
  }),
  bullets: Schema.Array(Schema.NonEmptyString).annotations({
    description: "up to 7 concise bullets of the change",
  }),
}) {}

const SYSTEM = `You are an assistant that writes crisp change notes for UIs.
Only use the provided changes and field labels. Be neutral and precise.
When numbers or dates change, mention deltas.  Prefer summarizing with deltas over regurgitating the actual change. Prefer human labels over raw paths.
Keep it short and non-repetitive. Do not invent data.`;

export async function POST(request: Request) {
  const res = await request.json();
  const input = Schema.decodeUnknownSync(RequestInput)(res);

  const model = OpenRouterLanguageModel.model(input.model, {
    reasoning: {
      effort: "minimal",
    },
  });

  const logic = Effect.gen(function* () {
    const output = yield* getSummary(input.change);

    return output;
  }).pipe(Effect.provide(model), Effect.provide(OpenRouter));

  const result = await Effect.runPromise(logic);
  const output = Schema.encodeSync(Summary)(result);

  return Response.json(output);
}

const getSummary = Effect.fn("getSummary")(function* (query: string) {
  const response = yield* LanguageModel.generateObject({
    prompt: [
      { role: "system", content: SYSTEM },
      { role: "user", content: query },
    ],
    schema: Summary,
  });

  return response.value;
});

const OpenRouter = OpenRouterClient.layerConfig({
  apiKey: Config.redacted("OPENROUTERAI_API_KEY"),
}).pipe(Layer.provide(FetchHttpClient.layer));
