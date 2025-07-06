import { Plugin, WorkspaceLeaf } from "obsidian";
import { OgentSidebarView } from "./views/OgentSidebarView.ts";
import { OgentSettingTab } from "./views/OgentSettingTab.ts";
import { MastraLanguageModel } from "@mastra/core";
import type { OgentMcpServer } from "./views/OgentMcpServerSettingModal.ts";

interface OgentPluginSettings {
  model: {
    provider: string;
    name: string;
    apiKey?: string;
  };
  mcpServers: Record<OgentMcpServer["name"], Omit<OgentMcpServer, "name">>;
}

const DEFAULT_SETTINGS: OgentPluginSettings = {
  model: {
    provider: "google",
    name: "gemini-2.5-flash",
  },
  mcpServers: {},
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
