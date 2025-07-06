import { Plugin, WorkspaceLeaf } from "obsidian";
import { OgentSidebarView } from "./views/OgentSidebarView.ts";
import { OgentSettingTab } from "./views/OgentSettingTab.ts";
import { MastraLanguageModel } from "@mastra/core";
import type { OgentMcpServer } from "./views/OgentMcpServerSettingModal.ts";
import { ModelProvider } from "./types/types.ts";

export interface OgentPluginSettings {
  model: {
    provider: ModelProvider;
    customProvider: {
      name?: string;
      apiKeyName?: string;
    };
    name: string;
  };
  mcpServers: Record<OgentMcpServer["name"], Omit<OgentMcpServer, "name">>;
  disabledToolIds: string[];
  instructions: string;
}

const DEFAULT_SETTINGS: OgentPluginSettings = {
  model: {
    provider: "google",
    customProvider: {},
    name: "gemini-2.5-flash",
  },
  mcpServers: {},
  disabledToolIds: [],
  instructions:
    `You are a helpful assistant that provides accurate information and can help plan activities based on user input.
Your primary function is to assist users with Obsidian-related tasks. When responding:
- On the initial question, use the \`obsidian-list-commands\` tool to get a list of available commands in Obsidian and clarify what the assistant can do.
- Always ask for clarification if the user input is ambiguous.
- If the user asks for a specific task, provide step-by-step instructions.
- If the user asks for a command, suggest relevant Obsidian commands.
- If the user asks for a file operation, suggest relevant Obsidian file operations.
- If the user asks for a shell command, suggest relevant Obsidian shell commands.

Use the Obsidian tools to perform tasks related to Obsidian.
`,
};

export default class OgentPlugin extends Plugin {
  settings: OgentPluginSettings = DEFAULT_SETTINGS;
  model: MastraLanguageModel | null = null;

  override async onload() {
    await this.loadSettings();
    this.addSettingTab(new OgentSettingTab(this.app, this));

    this.registerView(
      OgentSidebarView.VIEW_TYPE,
      (leaf) => new OgentSidebarView(leaf, this),
    );

    this.addRibbonIcon(
      "bot-message-square",
      "Open Ogent",
      (_: MouseEvent) => {
        this.activateView();
      },
    );
  }

  override onunload() {
    this.app.workspace.detachLeavesOfType(OgentSidebarView.VIEW_TYPE);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf =
      workspace.getLeavesOfType(OgentSidebarView.VIEW_TYPE)[0];
    if (!leaf) {
      const _leaf = workspace.getRightLeaf(false);
      if (!_leaf) {
        throw new Error("No right leaf available to create a new view.");
      }
      leaf = _leaf;

      await leaf.setViewState({
        type: OgentSidebarView.VIEW_TYPE,
        active: true,
      });
    }
    workspace.revealLeaf(leaf);
  }
}
