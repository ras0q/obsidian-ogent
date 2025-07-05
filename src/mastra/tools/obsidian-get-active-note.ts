import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App, TFile } from "obsidian";

export const obsidianGetActiveNoteTool = (app: App) =>
  createTool({
    id: "obsidian-get-active-note",
    description: "Get details of the currently active note in the workspace",
    inputSchema: z.object({}),
    outputSchema: z.object({
      path: z.string(),
      basename: z.string(),
      content: z.string(),
      created: z.number().optional(),
      modified: z.number().optional(),
    }),
    execute: async () => {
      const file = app.workspace.getActiveFile();
      if (!file || !(file instanceof TFile)) throw new Error("No active note");
      const content = await app.vault.read(file);
      return {
        path: file.path,
        basename: file.basename,
        content,
        created: file.stat?.ctime,
        modified: file.stat?.mtime,
      };
    },
  });
