import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { Agent } from "@mastra/core";

export const buildMastra = (agents: { [key: string]: Agent }) =>
  new Mastra({
    agents,
    logger: new PinoLogger({
      name: "Mastra",
      level: "info",
    }),
  });
