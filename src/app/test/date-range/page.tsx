"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Page() {
  const [query, setQuery] = useState("");
  const [readyToFire, setReadyToFire] = useState(false);
  const { fetchStatus, data } = useQuery({
    queryKey: ["test-date-range"],
    enabled: !!query && readyToFire,
    queryFn: async () => {
      const initial = await fetch("/api/date-range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const json = await initial.json();
      return json;
    },
  });

  useEffect(() => {
    if (fetchStatus === "idle") setReadyToFire(false);
  }, [fetchStatus]);

  if (!data) console.log({ data });

  return (
    <div className="p-2 flex flex-col gap-2 lg:gap-3 lg:p-3">
      <h1 className="text-2xl">Natural Language Date Ranges</h1>
      <div className="grid grid-cols-[auto_100px] gap-2">
        <Input
          type="text"
          placeholder="Describe a date range..."
          value={query}
          onChange={(e) => setQuery(e.currentTarget.value)}
        />
        <Button
          type="button"
          disabled={!query || fetchStatus === "fetching"}
          onClick={() => setReadyToFire(true)}
        >
          Parse
        </Button>
      </div>
      {fetchStatus === "fetching" && <div>Fetching...</div>}
      {Boolean(data) && fetchStatus === "idle" && (
        <div className="p-2">
          <h2 className="text-lg mb-2">Result</h2>
          <div>
            {new Date(data.startDate).toLocaleDateString("en-US", {
              timeZone: "UTC",
            })}{" "}
            to&nbsp;
            {new Date(data.endDate).toLocaleDateString("en-US", {
              timeZone: "UTC",
            })}
          </div>
          <div className="text-xs mt-1">{data.notes}</div>
        </div>
      )}
    </div>
  );
}
