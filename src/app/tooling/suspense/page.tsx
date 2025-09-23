import { setTimeout } from "node:timers";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

async function loadData() {
  const p: Promise<string> = new Promise((resolve) => {
    setTimeout(() => resolve("Hello, world!"), 3000);
  });

  return p;
}

export default function Page() {
  const data = loadData();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <div className="bg-blue-300 p-3">{data}</div>
    </Suspense>
  );
}
