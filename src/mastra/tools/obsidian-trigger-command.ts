import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";

export const obsidianTriggerCommandTool = (app: App) =>
  createTool({
    id: "obsidian-trigger-command",
    description: "Trigger a command in Obsidian",
    inputSchema: z.object({
      id: z.string().describe("The command to trigger"),
    }),
    outputSchema: z.object({
      success: z.boolean().describe(
        "Whether the command was successfully triggered",
      ),
    }),
    execute: async ({ context }) => {
      const { id } = context;
      // @ts-ignore: app.commands is private in Obsidian
      try {
        // @ts-ignore: app.commands.executeCommandById is private in Obsidian
        await app.commands.executeCommandById(id);
        return { success: true };
      } catch (error) {
        throw new Error(
          `Failed to execute command '${id}': ${error}`,
        );
      }
    },
  });
