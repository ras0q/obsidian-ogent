import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";

export const obsidianSearchNotesTool = (app: App) =>
  createTool({
    id: "obsidian-search-notes",
    description: "Search notes by filename or content",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
      inContent: z.boolean().optional().describe(
        "Search in content (default: false)",
      ),
    }),
    outputSchema: z.object({
      results: z.array(z.object({
        path: z.string(),
        basename: z.string(),
      })),
    }),
    execute: async ({ context }) => {
      const { query, inContent } = context;
      const files = app.vault.getMarkdownFiles();
      let results = files.filter((f) =>
        f.path.includes(query) || f.basename.includes(query)
      );
      if (inContent) {
        const filtered = [];
        for (const f of files) {
          const text = await app.vault.read(f);
          if (text.includes(query)) filtered.push(f);
        }
        results = filtered;
      }
      return {
        results: results.map((f) => ({ path: f.path, basename: f.basename })),
      };
    },
  });
