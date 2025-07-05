import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";

export const obsidianListCommandsTool = (app: App) =>
  createTool({
    id: "obsidian-list-commands",
    description: "List all available commands in Obsidian",
    inputSchema: z.object({}),
    outputSchema: z.object({
      commands: z.array(z.object({
        id: z.string().describe("The command ID"),
        name: z.string().describe("The command name"),
      })).describe("List of available commands"),
    }),
    execute: async () => {
      type AppCommands = {
        commands: Record<string, { id: string; name: string }>;
      };
      // @ts-ignore: app.commands is private in Obsidian
      const { commands }: AppCommands = app.commands;
      return await Promise.resolve({
        commands: Object.values(commands).map((command) => ({
          id: command.id,
          name: command.name,
        })),
      });
    },
  });
