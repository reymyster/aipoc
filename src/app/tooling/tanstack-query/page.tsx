"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function Page() {
  const [name, setName] = useState("");
  const [readyToFire, setReadyToFire] = useState(false);

  const { fetchStatus, data } = useQuery({
    queryKey: ["test-hello", name],
    enabled: !!name && readyToFire,
    queryFn: async () => {
      const initial = await fetch("/api/hello", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await initial.json();
      return json;
    },
  });

  useEffect(() => {
    if (fetchStatus === "idle") setReadyToFire(false);
  }, [fetchStatus]);

  const onClick = () => {
    setReadyToFire(true);
  };

  return (
    <div>
      <h2>Tanstack Query test</h2>
      <div className="grid grid-cols-3">
        <input
          type="text"
          placeholder="Enter Name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <input
          type="text"
          placeholder="Response"
          value={data?.text || ""}
          readOnly={true}
        />
        <button type="button" disabled={!name} onClick={onClick}>
          Test
        </button>
      </div>
    </div>
  );
}
