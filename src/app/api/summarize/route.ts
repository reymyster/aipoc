import { LanguageModel } from "@effect/ai";
import { Effect, Schema } from "effect";
import { Runtime } from "@/lib/server";

class RequestInput extends Schema.Class<RequestInput>("RequestInput")({
  change: Schema.NonEmptyString,
}) {}

class Summary extends Schema.Class<Summary>("Summary")({
  title: Schema.NonEmptyString.annotations({
    description: "short subject line",
  }),
  bullets: Schema.Array(Schema.NonEmptyString).annotations({
    description: "up to 7 concise bullets of the change",
  }),
  riskFlags: Schema.Array(Schema.NonEmptyString).annotations({
    description: "Potential risk flags e.g. large deltas",
  }),
}) {}

const SYSTEM = `You are an assistant that writes crisp change notes for UIs.
Only use the provided changes and field labels. Be neutral and precise.
When numbers change, mention deltas. Prefer human labels over raw paths.
Keep it short and non-repetitive. Do not invent data.`;

export async function POST(request: Request) {
  const res = await request.json();
  const input = Schema.decodeUnknownSync(RequestInput)(res);

  const logic = Effect.gen(function* () {
    const output = yield* getSummary(input.change);

    return output;
  });

  const result = await Runtime.runPromise(logic);
  const output = Schema.encodeSync(Summary)(result);

  return Response.json(output);
}

const getSummary = Effect.fn("getSummary")(function* (query: string) {
  const response = yield* LanguageModel.generateObject({
    prompt: `${SYSTEM} ${query}`,
    schema: Summary,
  });

  return response.value;
});
