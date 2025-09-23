import { LanguageModel } from "@effect/ai";
import { Effect } from "effect";
import { Runtime } from "@/lib/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function generateDadJoke() {
  const logic = Effect.gen(function* () {
    const response = yield* LanguageModel.generateText({
      prompt: "Generate a dad joke",
    });

    const d = new Date();
    const sd = d.toLocaleString("en-US", {
      timeZone: "America/Los_Angeles",
    });

    yield* Effect.logInfo(`Generated Dad Joke at ${sd}`);

    return {
      text: response.text,
      time: sd,
    };
  }).pipe(
    Effect.withSpan("generateDadJoke"),
    Effect.withLogSpan("generateDadJoke")
  );

  return await Runtime.runPromise(logic);
}

export default async function Page() {
  const data = await generateDadJoke();

  return (
    <div className="p-2">
      <h2 className="text-2xl mb-4">Dad Joke</h2>
      <p className="p-2">
        {data.text}
        <br />
        <span className="text-xs text-foreground/50">{data.time}</span>
      </p>
    </div>
  );
}
