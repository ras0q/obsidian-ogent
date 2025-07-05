import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App, TFile } from "obsidian";

export const obsidianUpdateNoteContentTool = (app: App) =>
  createTool({
    id: "obsidian-update-note-content",
    description: "Update the content of a note (overwrite)",
    inputSchema: z.object({
      path: z.string().describe("The path of the note"),
      content: z.string().describe("The new content"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const { path, content } = context;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) throw new Error("File not found");
      await app.vault.modify(file, content);
      return { success: true };
    },
  });
