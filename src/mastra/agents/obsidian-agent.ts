import { Agent, type MastraLanguageModel } from "@mastra/core/agent";
import { obsidianCreateNoteTool } from "../tools/obsidian-create-note.ts";
import { obsidianExecuteShellCommandTool } from "../tools/obsidian-execute-shell-command.ts";
import { obsidianGetActiveNoteTool } from "../tools/obsidian-get-active-note.ts";
import { obsidianGetNoteContentTool } from "../tools/obsidian-get-note-content.ts";
import { obsidianListCommandsTool } from "../tools/obsidian-list-commands.ts";
import { obsidianOpenNoteTool } from "../tools/obsidian-open-note.ts";
import { obsidianSearchNotesTool } from "../tools/obsidian-search-notes.ts";
import { obsidianTriggerCommandTool } from "../tools/obsidian-trigger-command.ts";
import { obsidianUpdateNoteContentTool } from "../tools/obsidian-update-note-content.ts";
import { obsidianOpenWikilinkTool } from "../tools/obsidian-open-wikilink.ts";
import OgentPlugin from "../../main.ts";

export const buildObsidianAgent = (
  plugin: OgentPlugin,
  model: MastraLanguageModel,
) =>
  new Agent({
    name: "Obsidian agent",
    instructions: plugin.settings.instructions,
    model,
    tools: {
      "obsidian-create-note": obsidianCreateNoteTool(plugin.app),
      "obsidian-execute-shell-command": obsidianExecuteShellCommandTool(
        plugin.app,
      ),
      "obsidian-get-active-note": obsidianGetActiveNoteTool(plugin.app),
      "obsidian-get-note-content": obsidianGetNoteContentTool(plugin.app),
      "obsidian-list-commands": obsidianListCommandsTool(plugin.app),
      "obsidian-open-note": obsidianOpenNoteTool(plugin.app),
      "obsidian-open-wikilink": obsidianOpenWikilinkTool(plugin.app),
      "obsidian-search-notes": obsidianSearchNotesTool(plugin.app),
      "obsidian-trigger-command": obsidianTriggerCommandTool(plugin.app),
      "obsidian-update-note-content": obsidianUpdateNoteContentTool(plugin.app),
    },
  });
