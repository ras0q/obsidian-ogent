import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import OgentPlugin from "../main.ts";
import {
  OgentMcpServer,
  OgentMcpServerSettingModal,
} from "./OgentMcpServerSettingModal.ts";
import { ModelProvider, supportedProviders } from "../types/types.ts";

export class OgentSettingTab extends PluginSettingTab {
  plugin: OgentPlugin;

  constructor(app: App, plugin: OgentPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    this.containerEl.empty();
    this.addModelSettings();
    this.addMCPServersSettings();
    if (this.plugin.settings.disabledToolIds.length > 0) {
      this.addDisabledMcpToolsSettings();
    }
    this.addInstructionsSetting();
  }

  addModelSettings() {
    const modelSettingsEl = this.containerEl.createEl("section");

    new Setting(modelSettingsEl)
      .setHeading()
      .setName("Model settings");

    new Setting(modelSettingsEl)
      .setName("Provider")
      .setDesc("Select the model provider.")
      .addDropdown((dropdown) =>
        dropdown
          .addOptions(
            Object.fromEntries(
              supportedProviders.map((provider) => [
                provider,
                provider.charAt(0).toUpperCase() + provider.slice(1),
              ]),
            ),
          )
          .setValue(this.plugin.settings.model.provider)
          .onChange(async (value) => {
            const provider = value as ModelProvider;
            if (supportedProviders.includes(provider)) {
              this.plugin.settings.model.provider = provider;
              this.plugin.settings.model.customProvider = {};
              await this.plugin.saveSettings();
            } else {
              new Notice(
                `Ogent: Unsupported model provider "${value}". Please select a valid provider.`,
              );
            }
          })
      );

    if (this.plugin.settings.model.provider === "custom") {
      new Setting(modelSettingsEl)
        .setClass("setting-item-sub")
        .setName("Custom provider")
        .setDesc(
          "Enter a custom model provider name. This will override the default provider.\n" +
            "See https://ai-sdk.dev/docs/foundations/providers-and-models",
        )
        .addText((text) =>
          text
            .setPlaceholder("e.g., mistral")
            .setValue(this.plugin.settings.model.customProvider.name || "")
            .onChange(async (value) => {
              this.plugin.settings.model.customProvider.name = value;
              await this.plugin.saveSettings();
            })
        );

      new Setting(modelSettingsEl)
        .setClass("setting-item-sub")
        .setName("Custom API key name")
        .setDesc(
          "Enter the environment variable name for the custom provider's API key.\n" +
            "This is used to set the API key for the custom provider.",
        )
        .addText((text) =>
          text
            .setPlaceholder("e.g., MISTRAL_API_KEY")
            .setValue(
              this.plugin.settings.model.customProvider.apiKeyName || "",
            )
            .onChange(async (value) => {
              this.plugin.settings.model.customProvider.apiKeyName = value;
              await this.plugin.saveSettings();
            })
        );
    }

    new Setting(modelSettingsEl)
      .setName("Name")
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

    new Setting(modelSettingsEl)
      .setName("API key")
      .setDesc("Enter your API key for the model provider")
      .addText((text) =>
        text
          .setPlaceholder("Your API key")
          .setValue(this.app.loadLocalStorage("ogent-api-key") || "")
          .onChange(async (value) => {
            this.app.saveLocalStorage("ogent-api-key", value);
            await this.plugin.saveSettings();
          })
      );
  }

  addMCPServersSettings() {
    const mcpServersEl = this.containerEl.createEl("section");

    const saveMcpServer = async (mcpServer: OgentMcpServer) => {
      console.log("Saving MCP server:", mcpServer);
      const { name, command, args, env } = mcpServer;
      this.plugin.settings.mcpServers[name] = { command, args, env };
      await this.plugin.saveSettings();
      this.display();
    };

    new Setting(mcpServersEl)
      .setHeading()
      .setName("MCP servers")
      .addButton((button) => {
        button
          .setCta()
          .setIcon("plus")
          .setTooltip("Add MCP server")
          .onClick(() => {
            const modal = new OgentMcpServerSettingModal(
              this.app,
              { name: "", command: "", args: [], env: {} },
              saveMcpServer,
            );
            modal.open();
          });
      });

    Object.entries(this.plugin.settings.mcpServers)
      .toSorted(([nameA], [nameB]) => nameA.localeCompare(nameB))
      .forEach(
        ([serverName, serverConfig]) => {
          new Setting(mcpServersEl)
            .setName(serverName)
            .setDesc("Configure MCP server settings")
            .addButton((button) => {
              button
                .setIcon("pencil")
                .setTooltip("Edit MCP server")
                .onClick(() => {
                  const modal = new OgentMcpServerSettingModal(
                    this.app,
                    { name: serverName, ...serverConfig },
                    (mcpServer) => {
                      if (mcpServer.name !== serverName) {
                        delete this.plugin.settings.mcpServers[serverName];
                      }

                      saveMcpServer(mcpServer);
                    },
                  );
                  modal.open();
                });
            })
            .addButton((button) => {
              button
                .setWarning()
                .setIcon("trash")
                .setTooltip("Delete MCP server")
                .onClick(async () => {
                  const confirmDelete = confirm(
                    `Are you sure you want to delete the MCP server "${serverName}"? This action cannot be undone.`,
                  );
                  if (!confirmDelete) {
                    return;
                  }

                  delete this.plugin.settings.mcpServers[serverName];
                  await this.plugin.saveSettings();
                  this.display();
                });
            });
        },
      );
  }

  addDisabledMcpToolsSettings() {
    const disabledToolsEl = this.containerEl.createEl("section");

    new Setting(disabledToolsEl)
      .setHeading()
      .setName("Disabled MCP tools");

    for (const disabledToolId of this.plugin.settings.disabledToolIds) {
      new Setting(disabledToolsEl)
        .setName(`${disabledToolId}`)
        .addButton((button) => {
          button
            .setWarning()
            .setIcon("trash")
            .setTooltip("Enable this tool")
            .onClick(async () => {
              this.plugin.settings.disabledToolIds.splice(
                this.plugin.settings.disabledToolIds.indexOf(disabledToolId),
                1,
              );
              await this.plugin.saveSettings();
              this.display();
            });
        });
    }
  }

  addInstructionsSetting() {
    const instructionsEl = this.containerEl.createEl("section");

    new Setting(instructionsEl)
      .setHeading()
      .setName("Instructions");

    new Setting(instructionsEl)
      .setName("Custom instructions")
      .setDesc(
        "Enter custom instructions for the agent. These will be used to guide the agent's behavior.",
      )
      .addTextArea((textArea) =>
        textArea
          .setPlaceholder("Enter custom instructions here...")
          .setValue(this.plugin.settings.instructions)
          .onChange(async (value) => {
            this.plugin.settings.instructions = value;
            await this.plugin.saveSettings();
          })
      );
  }
}
