import { LanguageModel } from "@effect/ai";
import { Effect } from "effect";
import { Runtime } from "@/lib/server";

async function generateDadJoke() {
  const logic = Effect.gen(function* () {
    const response = yield* LanguageModel.generateText({
      prompt: "Generate a dad joke",
    });

    return response;
  }).pipe(Effect.withSpan("generateDadJoke"));

  return await Runtime.runPromise(logic);
}

export default async function Page() {
  const data = await generateDadJoke();

  return (
    <div className="p-2">
      <h2 className="text-2xl mb-4">Dad Joke</h2>
      <p className="p-2">{data.text}</p>
    </div>
  );
}
