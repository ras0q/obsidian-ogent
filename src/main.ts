import { Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { OgentSidebarView } from "./views/OgentSidebarView.ts";
import { OgentSettingTab } from "./views/OgentSettingTab.ts";

interface OgentPluginSettings {
  model: {
    provider: string;
    name: string;
    apiKey?: string;
  };
}

const DEFAULT_SETTINGS: OgentPluginSettings = {
  model: {
    provider: "google",
    name: "gemini-2.5-flash",
  },
};

export default class OgentPlugin extends Plugin {
  settings: OgentPluginSettings = DEFAULT_SETTINGS;

  override async onload() {
    await this.loadSettings();
    this.addSettingTab(new OgentSettingTab(this.app, this));

    this.registerView(
      OgentSidebarView.VIEW_TYPE,
      (leaf) => new OgentSidebarView(leaf),
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
    this.configureApiKey();
  }

  async saveSettings() {
    await this.saveData(this.settings);
    this.configureApiKey();
  }

  configureApiKey() {
    const apiKey = this.settings.model.apiKey;
    if (!apiKey) {
      new Notice(
        "Ogent: API key is not set. Please configure it in the settings.",
      );
      return;
    }

    switch (this.settings.model.provider) {
      case "openai":
        globalThis.process.env.OPENAI_API_KEY = apiKey;
        break;
      case "google":
        globalThis.process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
        break;
      default:
        console.warn(
          `Unknown provider: ${this.settings.model.provider}`,
        );
    }
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
