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

export default function Page() {
  const [modifiedState, setModifiedState] = useState<FormState>(originalState);
  const [model, setModel] = useState("google/gemini-2.5-flash");
  const [readyToFire, setReadyToFire] = useState(false);

  const change: Record<string, string> | null = (() => {
    const c: Record<string, string> = {};
    let count = 0;

    if (
      originalState.startDate?.getTime() !== modifiedState.startDate?.getTime()
    ) {
      c[
        "Start Date"
      ] = `updated from ${originalState.startDate?.toDateString()} to ${
        modifiedState.startDate
      }; Start Date is the first date of an applicable range for this record`;
      count++;
    }

    if (originalState.endDate?.getTime() !== modifiedState.endDate?.getTime()) {
      c[
        "End Date"
      ] = `updated from ${originalState.endDate?.toDateString()} to ${
        modifiedState.endDate
      }; End Date is the last date of an applicable range for this record`;
      count++;
    }

    if (originalState.creditLimit !== modifiedState.creditLimit) {
      c["Credit Limit"] = `updated from ${currencyFormatter(
        originalState.creditLimit
      )} to ${currencyFormatter(
        modifiedState.creditLimit
      )}; Credit Limit is a USD dollar amount credit limit given to the user associated with this record.`;
      count++;
    }

    return count > 0 ? c : null;
  })();

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
      return json;
    },
  });

  useEffect(() => {
    if (fetchStatus === "idle") setReadyToFire(false);
  }, [fetchStatus]);

  if (data) console.log({ data });

  console.log({ model });

  return (
    <div className="p-2 max-w-5xl">
      <h1 className="text-2xl my-2">Difference Summarization</h1>
      <Separator />
      <div className="p-2 grid grid-cols-2 gap-2">
        <TestForm
          title="Original State"
          disabled={true}
          state={originalState}
        />
        <TestForm
          title="Modified State"
          state={modifiedState}
          setState={setModifiedState}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => setReadyToFire(true)}
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
            <CardTitle>Summary: {data.title}</CardTitle>
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
};

const originalState: FormState = {
  startDate: new Date(2025, 8, 1),
  endDate: new Date(2025, 8, 30),
  creditLimit: 2000,
};

type TestFormProps = {
  title: string;
  disabled?: boolean;
  state: FormState;
  setState?: Dispatch<SetStateAction<FormState>>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
}).format;

function TestForm({ title, disabled = false, state, setState }: TestFormProps) {
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
