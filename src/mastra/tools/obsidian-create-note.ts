import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";

export const obsidianCreateNoteTool = (app: App) =>
  createTool({
    id: "obsidian-create-note",
    description: "Create a new note in Obsidian",
    inputSchema: z.object({
      path: z.string().describe(
        "The path (including filename) for the new note",
      ),
      content: z.string().describe("The content of the new note"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      path: z.string(),
    }),
    execute: async ({ context }) => {
      const { path, content } = context;
      await app.vault.create(path, content);
      return { success: true, path };
    },
  });
