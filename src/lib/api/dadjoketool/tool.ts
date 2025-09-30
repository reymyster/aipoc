import { Tool, Toolkit } from "@effect/ai";
import {
  HttpClient,
  HttpClientRequest,
  HttpClientResponse,
} from "@effect/platform";
import { Effect, Array as EffectArray, Layer, Schema } from "effect";

class DadJoke extends Schema.Class<DadJoke>("DadJoke")({
  id: Schema.String,
  joke: Schema.String,
}) {}

class SearchResponse extends Schema.Class<SearchResponse>("SearchResponse")({
  results: Schema.Array(DadJoke),
}) {}

class ICanHazDadJoke extends Effect.Service<ICanHazDadJoke>()(
  "ICanHazDadJoke",
  {
    effect: Effect.gen(function* () {
      const httpClient = yield* HttpClient.HttpClient;

      const httpClientOk = httpClient.pipe(
        HttpClient.filterStatusOk,
        HttpClient.mapRequest(
          HttpClientRequest.prependUrl("https://icanhazdadjoke.com")
        )
      );

      const search = Effect.fn("ICanHazDadJoke.search")(function* (
        searchTerm: string
      ) {
        return yield* httpClientOk
          .get("/search", {
            acceptJson: true,
            urlParams: { term: searchTerm },
          })
          .pipe(
            Effect.flatMap(HttpClientResponse.schemaBodyJson(SearchResponse)),
            Effect.flatMap(({ results }) => EffectArray.head(results)),
            Effect.map((joke) => joke.joke),
            Effect.orDie
          );
      });

      return {
        search,
      } as const;
    }),
  }
) {}

const GetDadJoke = Tool.make("GetDadJoke", {
  description: "Get a hilarious dad joke from the ICanHazDadJoke API",
  success: Schema.String,
  failure: Schema.Never,
  parameters: {
    searchTerm: Schema.String.annotations({
      description: "The search term to use to find dad jokes",
    }),
  },
});

export const DadJokeTools = Toolkit.make(GetDadJoke);

export const DadJokeToolHandlers = DadJokeTools.toLayer(
  Effect.gen(function* () {
    // Access the `ICanHazDadJoke` service
    const icanhazdadjoke = yield* ICanHazDadJoke;
    return {
      // Implement the handler for the `GetDadJoke` tool call request
      GetDadJoke: ({ searchTerm }) => icanhazdadjoke.search(searchTerm),
    };
  })
).pipe(Layer.provide(ICanHazDadJoke.Default));
