import {
  App,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  WorkspaceLeaf,
} from "obsidian";
import { OgentSidebarView } from "./views/OgentSidebarView.ts";

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

    globalThis.process.env.GOOGLE_GENERATIVE_AI_API_KEY =
      this.settings.model.apiKey;

    // サイドバーViewを登録
    this.registerView(
      OgentSidebarView.VIEW_TYPE,
      (leaf) => new OgentSidebarView(leaf),
    );

    // リボンアイコンからサイドバーを開く
    this.addRibbonIcon(
      "dice",
      "Ogent AI Agent",
      (_: MouseEvent) => {
        this.activateView();
      },
    );
  }

  override onunload() {
    this.app.workspace.detachLeavesOfType(OgentSidebarView.VIEW_TYPE);
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
}

class OgentSettingTab extends PluginSettingTab {
  plugin: OgentPlugin;

  constructor(app: App, plugin: OgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Model Provider")
      .setDesc("Select the model provider")
      .addDropdown((dropdown) => {
        dropdown
          .addOption("google", "Google")
          .addOption("openai", "OpenAI")
          .setValue(this.plugin.settings.model.provider)
          .onChange(async (value) => {
            this.plugin.settings.model.provider = value;
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName("Model Name")
      .setDesc("Enter the model name")
      .addText((text) =>
        text
          .setPlaceholder("e.g., gemini-2.5-flash")
          .setValue(this.plugin.settings.model.name)
          .onChange(async (value) => {
            this.plugin.settings.model.name = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Enter your API key for the model provider")
      .addText((text) =>
        text
          .setPlaceholder("Your API key")
          .setValue(this.plugin.settings.model.apiKey || "")
          .onChange(async (value) => {
            this.plugin.settings.model.apiKey = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
