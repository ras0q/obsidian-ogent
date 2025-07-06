import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";

export const obsidianOpenWikilinkTool = (app: App) =>
  createTool({
    id: "obsidian-open-wikilink",
    description:
      "Open a note by wikilink (e.g. [[Note name]]) in the workspace",
    inputSchema: z.object({
      wikilink: z.string().describe(
        "The wikilink to open (e.g. [[Note name]])",
      ),
    }),
    outputSchema: z.object({
      success: z.boolean(),
      path: z.string().optional(),
    }),
    execute: async ({ context }) => {
      const { wikilink } = context;
      const linkText = wikilink.replace(/^\[\[|\]\]$/g, ""); // Remove [[ and ]]
      await app.workspace.openLinkText(linkText, "");
      const file = app.workspace.getActiveFile();
      return { success: true, path: file?.path };
    },
  });
