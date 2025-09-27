"use client";

import { Effect } from "effect";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RpcHelloClient } from "@/lib/api";
import { Runtime } from "@/lib/client";

const logic = Effect.fn("TestHelloClient")(function* (name: string) {
  console.log(`querying rpc with name: ${name}`);

  const client = yield* RpcHelloClient;
  const response = yield* client.HelloRequest({ name });

  return response;
}, Effect.provide(RpcHelloClient.Default));

export default function Page() {
  const [name, setName] = useState("");
  const [res, setRes] = useState("");
  const [loading, setLoading] = useState(false);

  const query = async () => {
    setLoading(true);

    const response = await Runtime.runPromise(logic(name));
    setRes(response);

    setLoading(false);
  };

  return (
    <div className="p-2 flex flex-col gap-2 lg:gap-3 lg:p-3">
      <h1 className="text-2xl">Effect RPC Test</h1>
      <div className="grid grid-cols-[auto_100px] gap-2 lg:gap-3">
        <Input
          type="text"
          placeholder="Please enter your name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Button type="button" disabled={loading || !name} onClick={query}>
          Submit
        </Button>
      </div>
      {loading && <div>Loading...</div>}
      {!loading && Boolean(res) && <div>Response --&gt;{res}&lt;--</div>}
    </div>
  );
}
