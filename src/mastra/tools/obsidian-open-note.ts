import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App, TFile } from "obsidian";

export const obsidianOpenNoteTool = (app: App) =>
  createTool({
    id: "obsidian-open-note",
    description: "Open a note in the active workspace tab",
    inputSchema: z.object({
      path: z.string().describe("The path of the note to open"),
    }),
    outputSchema: z.object({
      success: z.boolean(),
    }),
    execute: async ({ context }) => {
      const { path } = context;
      const file = app.vault.getAbstractFileByPath(path);
      if (!file || !(file instanceof TFile)) throw new Error("File not found");
      await app.workspace.getLeaf(true).openFile(file);
      return { success: true };
    },
  });
