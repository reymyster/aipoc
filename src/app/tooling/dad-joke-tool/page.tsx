"use client";

import { Effect } from "effect";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RpcDadJokeClient } from "@/lib/api/dadjoketool/rpc-definition";
import { Runtime } from "@/lib/client";

const logic = Effect.fn("TestDadJokeClient")(function* (topic: string) {
  console.log(`querying rpc with topic: ${topic}`);

  const client = yield* RpcDadJokeClient;
  const response = yield* client.GetDadJoke({ topic });

  return response;
}, Effect.provide(RpcDadJokeClient.Default));

export default function Page() {
  const [topic, setTopic] = useState("");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);

  const query = async () => {
    setLoading(true);

    const response = await Runtime.runPromise(logic(topic));
    setRes(response);

    setLoading(false);
  };

  return (
    <div className="p-2 flex flex-col gap-2 lg:gap-3 lg:p-3">
      <h1 className="text-2xl">Effect AI Toolkit Test</h1>
      <div className="grid grid-cols-[auto_100px] gap-2 lg:gap-3">
        <Input
          type="text"
          placeholder="Please enter a brief topic"
          value={topic}
          onChange={(e) => setTopic(e.currentTarget.value)}
        />
        <Button type="button" disabled={loading || !topic} onClick={query}>
          Submit
        </Button>
      </div>
      {loading && <div>Loading...</div>}
      {!loading && Boolean(res) && (
        <div>
          Response <br />
          <br />
          <pre className="text-wrap">{res}</pre>
        </div>
      )}
    </div>
  );
}
