"use client";

import {
  Config,
  Effect,
  Layer,
  Logger,
  LogLevel,
  ManagedRuntime,
} from "effect";

export const MainLayer = Layer.mergeAll(Logger.pretty);
export const Runtime = ManagedRuntime.make(MainLayer);
