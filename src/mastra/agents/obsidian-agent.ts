import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";
import { Memory } from "@mastra/memory";
import { App } from "obsidian";
import { buildObsidianTools } from "../tools/obsidian/obsidian-tool.ts";

export const buildObsidianAgent = (app: App) =>
  new Agent({
    name: "Obsidian Agent",
    instructions: `
      You are a helpful assistant that provides accurate information and can help planning activities based on user input.
      Your primary function is to assist users with Obsidian-related tasks. When responding:
      - Always ask for clarification if the user input is ambiguous
      - If the user asks for a specific task, provide step-by-step instructions
      - If the user asks for a command, suggest relevant Obsidian commands
      - If the user asks for a file operation, suggest relevant Obsidian file operations
      - If the user asks for a shell command, suggest relevant Obsidian shell commands

      Use the Obsidian tools to perform tasks related to Obsidian.
`,
    model: google("gemini-2.5-flash"),
    tools: buildObsidianTools(app),
    memory: new Memory({
      // TODO: `file:` cannot be used
      // storage: new LibSQLStore({
      //   url: 'file:../mastra.db', // path is relative to the .mastra/output directory
      // }),
    }),
  });
