import { App, PluginSettingTab, Setting } from "obsidian";
import OgentPlugin from "../main.ts";

export class OgentSettingTab extends PluginSettingTab {
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
