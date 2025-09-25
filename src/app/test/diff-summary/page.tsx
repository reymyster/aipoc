"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDownIcon, Loader2Icon, WandSparklesIcon } from "lucide-react";
import { type Dispatch, type SetStateAction, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const getShortDate = (d: Date | undefined): string => {
  if (!d) return "1900-01-01";
  return d.toISOString().slice(0, 10);
};

export default function Page() {
  const [modifiedState, setModifiedState] = useState<FormState>(originalState);
  const [model, setModel] = useState("x-ai/grok-4-fast:free");
  const [readyToFire, setReadyToFire] = useState(false);

  const onReset = () => setModifiedState(originalState);

  const change: Record<string, string> | null = (() => {
    const c: Record<string, string> = {};
    let count = 0;

    if (
      originalState.startDate?.getTime() !==
        modifiedState.startDate?.getTime() ||
      originalState.endDate?.getTime() !== modifiedState.endDate?.getTime()
    ) {
      c["ApplicableDateRange"] = `updated from ${getShortDate(
        originalState.startDate
      )} -> ${getShortDate(originalState.endDate)} to ${getShortDate(
        modifiedState.startDate
      )} -> ${getShortDate(modifiedState.endDate)}`;
      count++;
    }

    // if (
    //   originalState.startDate?.getTime() !== modifiedState.startDate?.getTime()
    // ) {
    //   c[
    //     "Start Date"
    //   ] = `updated from ${originalState.startDate?.toDateString()} to ${
    //     modifiedState.startDate
    //   }; Start Date is the first date of an applicable range for this record`;
    //   count++;
    // }

    // if (originalState.endDate?.getTime() !== modifiedState.endDate?.getTime()) {
    //   c[
    //     "End Date"
    //   ] = `updated from ${originalState.endDate?.toDateString()} to ${
    //     modifiedState.endDate
    //   }; End Date is the last date of an applicable range for this record`;
    //   count++;
    // }

    if (originalState.creditLimit !== modifiedState.creditLimit) {
      c["Credit Limit"] = `updated from ${currencyFormatter(
        originalState.creditLimit
      )} to ${currencyFormatter(
        modifiedState.creditLimit
      )}; Credit Limit is a USD dollar amount credit limit given to the user associated with this record.`;
      count++;
    }

    if (
      originalState.streetAddress !== modifiedState.streetAddress ||
      originalState.city !== modifiedState.city ||
      originalState.state !== modifiedState.state ||
      originalState.zip !== modifiedState.zip
    ) {
      c[
        "Address"
      ] = `updated from "${originalState.streetAddress}, ${originalState.city}, ${originalState.state} ${originalState.zip}" to "${modifiedState.streetAddress}, ${modifiedState.city}, ${modifiedState.state} ${modifiedState.zip}"`;
      count++;
    }

    return count > 0 ? c : null;
  })();

  const getRisks = () => {
    const risks: string[] = [];

    if (originalState.creditLimit !== modifiedState.creditLimit) {
      const limitChange = Math.abs(
        originalState.creditLimit - modifiedState.creditLimit
      );
      if (limitChange > 2000 && limitChange < 3000) {
        risks.push(`⚠️ Warning: Credit Limit modified by over $2000`);
      } else if (limitChange >= 3000) {
        risks.push(
          `⛔ Action Required: Credit Limit modified by over $3000, manager approval required.`
        );
      }
    }

    if (
      originalState.state !== modifiedState.state &&
      originalState.streetAddress === modifiedState.streetAddress &&
      originalState.city === modifiedState.city &&
      originalState.zip === modifiedState.zip
    ) {
      risks.push(
        `⚠️ Warning: State updated but Street/City/ZIP remain the same, please double check.`
      );
    }

    return risks;
  };

  const { fetchStatus, data } = useQuery({
    queryKey: [
      "test-summary",
      modifiedState.creditLimit,
      modifiedState.endDate?.getTime() ?? 0,
      modifiedState.startDate?.getTime() ?? 0,
    ],
    enabled: readyToFire,
    queryFn: async () => {
      if (!change) return { title: "No Changes", bullets: [] };
      const initial = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ change: JSON.stringify(change), model }),
      });
      const json = await initial.json();
      return { ...json, bullets: [...json.bullets, ...getRisks()] };
    },
  });

  useEffect(() => {
    if (fetchStatus === "idle") setReadyToFire(false);
  }, [fetchStatus]);

  if (data) console.log({ data });

  return (
    <div className="p-2 max-w-5xl">
      <h1 className="text-2xl my-2">Difference Summarization</h1>
      <Separator />
      <div className="p-2 grid grid-cols-2 gap-2">
        <TestForm title="Original" disabled={true} state={originalState} />
        <TestForm
          title="Edited"
          state={modifiedState}
          setState={setModifiedState}
          onReset={onReset}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setReadyToFire(true)}
          className="cursor-pointer"
        >
          Summarize <WandSparklesIcon className="size-4 text-green-500" />
        </Button>
        <Select onValueChange={(e) => setModel(e)} value={model}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select LLM Model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="x-ai/grok-4-fast:free">Grok 4 Fast</SelectItem>
            <SelectItem value="google/gemini-2.5-flash">
              Gemini 2.5 Flash
            </SelectItem>
            <SelectItem value="deepseek/deepseek-chat-v3-0324">
              DeepSeek Chat v3
            </SelectItem>
            <SelectItem value="openai/gpt-5-mini">GPT 5 Mini</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Separator />
      {fetchStatus === "fetching" && (
        <div className="flex items-center justify-center">
          <Loader2Icon className="size-16 animate-spin m-4" />
        </div>
      )}
      {Boolean(data) && fetchStatus === "idle" && (
        <Card className="m-2">
          <CardHeader>
            <CardTitle>
              <h2 className="text-base font-bold">{data.title}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc ml-2">
              {data?.bullets?.map((bullet: string) => (
                <li key={bullet}>{bullet}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

type FormState = {
  startDate: Date | undefined;
  endDate: Date | undefined;
  creditLimit: number;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
};

const originalState: FormState = {
  startDate: new Date(2025, 8, 1),
  endDate: new Date(2025, 8, 30),
  creditLimit: 2000,
  streetAddress: "123 Main St",
  city: "Hometown",
  state: "CA",
  zip: "90210",
};

type TestFormProps = {
  title: string;
  disabled?: boolean;
  state: FormState;
  setState?: Dispatch<SetStateAction<FormState>>;
  onReset?: () => void;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format;

function TestForm({
  title,
  disabled = false,
  state,
  setState,
  onReset,
}: TestFormProps) {
  const setStartDate = (startDate: Date | undefined) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, startDate }));
  };
  const setEndDate = (endDate: Date | undefined) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, endDate }));
  };
  const setCreditLimit = (creditLimit: number) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, creditLimit }));
  };
  const setStreetAddress = (streetAddress: string) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, streetAddress }));
  };
  const setCity = (city: string) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, city }));
  };
  const setStateAddress = (state: string) => {
    if (typeof setState !== "undefined")
      setState((prev) => ({ ...prev, state }));
  };
  const setZip = (zip: string) => {
    if (typeof setState !== "undefined") setState((prev) => ({ ...prev, zip }));
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardAction>
          <Button
            onClick={onReset}
            variant="outline"
            disabled={disabled || !onReset}
            className={cn(
              disabled || !onReset ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            Reset
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-row gap-3">
          <DatePicker
            title="Start Date"
            controlName="startDate"
            disabled={disabled}
            date={state.startDate}
            setDate={setStartDate}
          />
          <DatePicker
            title="End Date"
            controlName="endDate"
            disabled={disabled}
            date={state.endDate}
            setDate={setEndDate}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-row justify-between">
            <Label>Credit Limit</Label>
            <span className={cn(disabled && "text-foreground/50")}>
              {currencyFormatter(state.creditLimit)}
            </span>
          </div>
          <Slider
            value={[state.creditLimit]}
            onValueChange={(e) => setCreditLimit(e[0])}
            max={10000}
            step={100}
            className="w-full mt-2"
            disabled={disabled}
          />
        </div>
        <Separator />
        <div className="flex flex-col gap-2">
          <Label>Street Address</Label>
          <Input
            type="text"
            disabled={disabled}
            value={state.streetAddress}
            onChange={(e) => setStreetAddress(e.currentTarget.value)}
          />
        </div>
        <div className="flex flex-row gap-2">
          <div className="flex flex-col gap-2">
            <Label>City</Label>
            <Input
              type="text"
              disabled={disabled}
              value={state.city}
              onChange={(e) => setCity(e.currentTarget.value)}
            />
          </div>
          <div className="flex flex-col gap-2 grow-0 w-16">
            <Label>State</Label>
            <Input
              type="text"
              disabled={disabled}
              value={state.state}
              onChange={(e) => setStateAddress(e.currentTarget.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>ZIP</Label>
            <Input
              type="text"
              disabled={disabled}
              value={state.zip}
              onChange={(e) => setZip(e.currentTarget.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DatePicker({
  title,
  controlName,
  disabled,
  date,
  setDate,
}: {
  title: string;
  controlName: string;
  disabled: boolean;
  date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={controlName} className="px-1">
        {title}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={controlName}
            className="w-48 justify-between font-normal"
            disabled={disabled}
          >
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
