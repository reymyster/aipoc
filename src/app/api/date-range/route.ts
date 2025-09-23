import { LanguageModel } from "@effect/ai";
import { Effect, Schema } from "effect";
import { Runtime } from "@/lib/server";

class RequestInput extends Schema.Class<RequestInput>("RequestInput")({
  query: Schema.NonEmptyString,
}) {}

class RangeResult extends Schema.Class<RangeResult>("RangeResult")({
  startDate: Schema.DateFromString.annotations({
    description: "First Date of a Range",
    decodingFallback: () => Effect.succeed(new Date()),
  }),
  endDate: Schema.DateFromString.annotations({
    description: "Last Date of a Range",
    decodingFallback: () => Effect.succeed(new Date()),
  }),
  notes: Schema.String.annotations({
    description: "Short Explanation of how the range was interpreted",
  }),
  confidence: Schema.Number,
}) {}

export async function POST(request: Request) {
  const res = await request.json();
  const input = Schema.decodeUnknownSync(RequestInput)(res);

  const logic = Effect.gen(function* () {
    const output = yield* getRange(input.query);

    return output.value;
  });

  const result = await Runtime.runPromise(logic);
  const output = Schema.encodeSync(RangeResult)(result);

  return Response.json(output);
}

const getRange = Effect.fn("getRange")(function* (query: string) {
  const response = yield* LanguageModel.generateObject({
    prompt: `${_systemPrompt} ${query}`,
    schema: RangeResult,
  });

  return response;
});

const _systemPrompt = `
Role & Goal
You are a strict date-range normalizer. Given a short natural-language query, return a calendar date range as ISO dates. You must resolve relative phrases (e.g., “last month”, “next 7 days”) based on the provided “today” and time zone. Your output is JSON only in the exact schema below.

Today & Timezone Context

TODAY: 2025-09-23

TIMEZONE: America/Los_Angeles

Interpret relative phrases in this timezone.

General Rules

Dates only (no times). If times are present in the query, truncate to start of day for start_date and end of day for end_date (but still output dates only).

Inclusive range semantics: the returned start_date and end_date are both included.

If the user gives one absolute date, set both start_date and end_date to that date.

If the query is open-ended like “since May 1”, set start_date=May 1 and end_date=TODAY.

If the query is ambiguous, choose the most common business interpretation and explain it in notes. Lower confidence accordingly.

Validate: if end_date < start_date, swap or fix based on intent; explain in notes.

No extra text outside the JSON object.

Interpretation Policies (be consistent)

“Last N days”: rolling window including today.
Example on 2025-08-28: “last 7 days” → 2025-08-22 … 2025-08-28.

“Past N days”: same as “last N days”.

“Next N days”: rolling window starting tomorrow.
Example on 2025-08-28: “next 7 days” → 2025-08-29 … 2025-09-04.

“This week”: calendar week Monday–Sunday in TIMEZONE containing TODAY.

“Last week”: previous calendar week Monday–Sunday.

“This month”: first to last day of the current calendar month.

“Last month”: entire previous calendar month.

“This quarter”: calendar quarter (Q1=Jan–Mar, Q2=Apr–Jun, Q3=Jul–Sep, Q4=Oct–Dec).

“Last quarter”: previous calendar quarter.

“This year / Last year”: Jan 1–Dec 31 of the respective year.

“Weekend” (without dates): the upcoming Sat–Sun relative to TODAY (if TODAY is Sat or Sun, use the current weekend).

“Week to date (WTD)”: Monday of current week through TODAY.
“Month to date (MTD)”: first of current month through TODAY.
“Quarter to date (QTD)”, “Year to date (YTD)”: analogous.

Bounded phrases

“from A to B”, “between A and B”, “A–B”, “through B” → inclusive of both A and B.

“before A” → start_date = MIN_SUPPORTED_DATE, end_date = day_before(A).

“after A” / “since A” → start_date = A, end_date = TODAY.

“by A” → start_date = MIN_SUPPORTED_DATE, end_date = A.

“until A” → same as “through A”.

Locale & formats: Parse MM/DD/YYYY, DD/MM/YYYY, named months, short months, ordinals (“Aug 3rd”), and 2-digit years (assume 2000s unless older clearly intended; explain assumption).

Edge Handling

If the user’s intent cannot be determined, return TODAY..TODAY with confidence=0.2 and explain why in notes.

If a holiday or fiscal period is referenced without a calendar, assume US federal holidays and calendar quarters, and note the assumption.
`;
