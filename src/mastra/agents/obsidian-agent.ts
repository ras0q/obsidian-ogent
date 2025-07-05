import { Agent, type MastraLanguageModel } from "@mastra/core/agent";
import { App } from "obsidian";
import { obsidianCreateNoteTool } from "../tools/obsidian-create-note.ts";
import { obsidianExecuteShellCommandTool } from "../tools/obsidian-execute-shell-command.ts";
import { obsidianGetActiveNoteTool } from "../tools/obsidian-get-active-note.ts";
import { obsidianGetNoteContentTool } from "../tools/obsidian-get-note-content.ts";
import { obsidianListCommandsTool } from "../tools/obsidian-list-commands.ts";
import { obsidianOpenNoteTool } from "../tools/obsidian-open-note.ts";
import { obsidianSearchNotesTool } from "../tools/obsidian-search-notes.ts";
import { obsidianTriggerCommandTool } from "../tools/obsidian-trigger-command.ts";
import { obsidianUpdateNoteContentTool } from "../tools/obsidian-update-note-content.ts";

export const buildObsidianAgent = (app: App, model: MastraLanguageModel) =>
  new Agent({
    name: "Obsidian Agent",
    instructions: `
      You are a helpful assistant that provides accurate information and can help plan activities based on user input.
      Your primary function is to assist users with Obsidian-related tasks. When responding:
      - On the initial question, use the \`obsidian-list-commands\` tool to get a list of available commands in Obsidian and clarify what the assistant can do.
      - Always ask for clarification if the user input is ambiguous.
      - If the user asks for a specific task, provide step-by-step instructions.
      - If the user asks for a command, suggest relevant Obsidian commands.
      - If the user asks for a file operation, suggest relevant Obsidian file operations.
      - If the user asks for a shell command, suggest relevant Obsidian shell commands.

      Use the Obsidian tools to perform tasks related to Obsidian.
`,
    model,
    tools: {
      "obsidian-create-note": obsidianCreateNoteTool(app),
      "obsidian-execute-shell-command": obsidianExecuteShellCommandTool(app),
      "obsidian-get-active-note": obsidianGetActiveNoteTool(app),
      "obsidian-get-note-content": obsidianGetNoteContentTool(app),
      "obsidian-list-commands": obsidianListCommandsTool(app),
      "obsidian-open-note": obsidianOpenNoteTool(app),
      "obsidian-search-notes": obsidianSearchNotesTool(app),
      "obsidian-trigger-command": obsidianTriggerCommandTool(app),
      "obsidian-update-note-content": obsidianUpdateNoteContentTool(app),
    },
  });
