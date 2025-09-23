"use client";

import Fuse, { type FuseResultMatch } from "fuse.js";
import { Fragment, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import rawMenuData from "@/data/menu.json";

type MenuItem = {
  id: string;
  label: string;
  breadcrumbs: string[];
  description: string;
  path?: string;
  leafWithParent?: string;
  normalized?: string[];
};

const AbbreviationMap: Record<string, string> = {
  ar: "Accounts Receivable",
  ap: "Accounts Payable",
  gl: "General Ledger",
  fx: "Foreign Exchange",
  jes: "Journal Entries",
  forex: "Foreign Exchange",
  mo: "Money Order",
  mt: "Money Transfer",
  hscc: "High Speed Check Cashing",
  je: "Journal Entry",
};

const rawMenuItemsById = new Map(rawMenuData.map((item) => [item.fKey, item]));
const menuParents = new Set(rawMenuData.map((i) => i.fParent).filter((i) => i));
const getBreadcrumbsById = (id: string): string[] => {
  const item = rawMenuItemsById.get(id);
  if (!item) return [];

  const crumbs = [item.fName];

  let parent = rawMenuItemsById.get(item.fParent);
  let depth = 0;
  while (parent && depth++ < 8) {
    crumbs.unshift(parent.fName);
    parent = rawMenuItemsById.get(parent.fParent);
  }

  return crumbs;
};

const menuItemsFirstPass = rawMenuData.map((item) => {
  const breadcrumbs = getBreadcrumbsById(item.fKey);

  return {
    id: item.fKey,
    label: item.fName,
    breadcrumbs,
    description: item.fDescription,
  } satisfies MenuItem;
});

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "");

const prepareMenuItems = (
  items: MenuItem[],
  abbreviations: Record<string, string>
) => {
  return items.map((item) => {
    const path = item.breadcrumbs.join(" → ");
    const last2 = item.breadcrumbs.slice(-2).join(" > ");
    const variants = new Set<string>([
      item.label,
      path,
      last2,
      item.description,
    ]);

    // expand abbreviations bi-directionally (AR <-> Accounts Receivable)
    for (const [k, v] of Object.entries(abbreviations)) {
      if (path.toLowerCase().includes(v.toLowerCase())) variants.add(k);
    }

    return {
      ...item,
      path,
      leafWithParent: last2,
      normalized: Array.from(variants).map(norm),
    };
  });
};

const onlyMenuLeaves = menuItemsFirstPass.filter((i) => !menuParents.has(i.id));
const preparedMenu = prepareMenuItems(onlyMenuLeaves, AbbreviationMap);

const fuse = new Fuse(preparedMenu, {
  includeScore: true,
  includeMatches: true,
  findAllMatches: true,
  shouldSort: true,
  ignoreLocation: true,
  threshold: 0.32, // tighter = fewer, more precise hits (tune 0.2-0.4)
  distance: 512, // how far terms can be
  minMatchCharLength: 2,
  keys: [
    { name: "label", weight: 0.4 }, // leaf name
    { name: "leafWithParent", weight: 0.25 }, // last two crumbs
    { name: "path", weight: 0.15 }, // full breadcrumb string
    { name: "normalized", weight: 0.25 }, // normalized variants
  ],
});

function expandQuery(q: string) {
  const Q = norm(q.trim());
  const parts = Q.split(/\s+/);
  const expanded = parts.map((p) =>
    AbbreviationMap[p] ? norm(AbbreviationMap[p]) : p
  );
  const variants = new Set<string>([Q, expanded.join(" ")]);
  return Array.from(variants);
}

function searchInstant(q: string, topK = 10) {
  const queries = expandQuery(q);
  const seen = new Map<
    string,
    {
      item: MenuItem;
      score: number;
      matches?: readonly FuseResultMatch[];
    }
  >();
  for (const v of queries) {
    for (const r of fuse.search(v, { limit: Math.max(50, topK * 5) })) {
      const cur = seen.get(r.item.id);
      if (!cur || (r.score ?? 1) < cur.score) {
        seen.set(r.item.id, {
          item: r.item,
          score: r.score ?? 1,
          matches: r.matches,
        });
      }
    }
  }

  return Array.from(seen.values())
    .sort((a, b) => a.score - b.score)
    .slice(0, topK)
    .map(({ item, score }) => ({
      id: item.id,
      title: item.label,
      path: item.path,
      score: 1 - score, // convert Fuse "lower is better" to higher = better
    }));
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

export default function Page() {
  const [searchValue, setSearchValue] = useState("");
  const debouncedSearchValue = useDebouncedValue(searchValue, 100);
  const [searchResults, setSearchResults] = useState<
    ReturnType<typeof searchInstant>
  >([]);

  useEffect(() => {
    if (!debouncedSearchValue.trim()) {
      setSearchResults([]);
      return;
    }

    const results = searchInstant(debouncedSearchValue);
    console.log({ results });
    setSearchResults(results);
  }, [debouncedSearchValue]);

  const clear = () => setSearchValue("");

  return (
    <div className="p-2 flex flex-col gap-2 lg:gap-4">
      <h2 className="text-2xl">Quick Search</h2>
      <div className="p-2 grid grid-cols-[auto_100px] gap-2">
        <Input
          type="text"
          placeholder="Quick Search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.currentTarget.value)}
        />
        <Button className="cursor-pointer" onClick={clear}>
          Clear
        </Button>
      </div>
      {searchResults.length > 0 && (
        <Fragment>
          <hr className="my-1" />
          <div className="p-3 -mt-3">
            <ul>
              {searchResults.map((result) => (
                <li key={result.id}>{result.path}</li>
              ))}
            </ul>
          </div>
        </Fragment>
      )}
    </div>
  );
}
