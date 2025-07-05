import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { weatherWorkflow } from "./workflows/weather-workflow.ts";
import { Agent } from "@mastra/core";

export const buildMastra = (agents: { [key: string]: Agent }) =>
  new Mastra({
    workflows: { weatherWorkflow },
    agents,
    logger: new PinoLogger({
      name: "Mastra",
      level: "info",
    }),
  });
