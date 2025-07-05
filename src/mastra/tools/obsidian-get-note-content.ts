import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App, TFile } from "obsidian";

export const obsidianGetNoteContentTool = (app: App) =>
  createTool({
    id: "obsidian-get-note-content",
    description: "Get the content of a note",
    inputSchema: z.object({
      path: z.string().describe("The path of the note"),
    }),
    outputSchema: z.object({
      content: z.string(),
    }),
    execute: async ({ context }) => {
      const { path } = context;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) throw new Error("File not found");
      const content = await app.vault.read(file);
      return { content };
    },
  });
