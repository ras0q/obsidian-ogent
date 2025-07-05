import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherWorkflow } from "./workflows/weather-workflow.ts";
import { Agent } from "@mastra/core";

export const buildMastra = (agents: { [key: string]: Agent }) =>
  new Mastra({
    workflows: { weatherWorkflow },
    agents,
    // TODO: `:memory:` cannot be used
    // storage: new LibSQLStore({
    //   // stores telemetry, evals, ... into memory storage, if it needs to persist, change to file:../mastra.db
    //   url: ":memory:",
    // }),
    logger: new PinoLogger({
      name: "Mastra",
      level: "info",
    }),
  });
