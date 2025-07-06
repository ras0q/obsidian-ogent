import { App, Modal, Setting } from "obsidian";

export type OgentMcpServer = {
  name: string;
  command: string;
  args: string[];
  env: Record<string, string>;
};

export class OgentMcpServerSettingModal extends Modal {
  constructor(
    app: App,
    mcpServer: OgentMcpServer,
    onSave?: (server: OgentMcpServer) => void,
  ) {
    super(app);
    this.setTitle("MCP server settings");

    const mcpServerCopy = { ...mcpServer };

    new Setting(this.contentEl)
      .setName("Server name")
      .setDesc("Edit the name of the MCP server")
      .addText((text) => {
        text
          .setPlaceholder("e.g., My MCP Server")
          .setValue(mcpServerCopy.name || "")
          .onChange((value) => {
            mcpServerCopy.name = value;
          });
      });

    new Setting(this.contentEl)
      .setName("Command")
      .setDesc("Edit the command to run the MCP server")
      .addText((text) => {
        text
          .setPlaceholder("e.g., mcp-server start")
          .setValue(mcpServerCopy.command || "")
          .onChange((value) => {
            mcpServerCopy.command = value;
          });
      });

    new Setting(this.contentEl)
      .setName("Arguments")
      .setDesc("Edit the arguments for the MCP server command (One per line)")
      .addTextArea((textArea) => {
        textArea
          .setPlaceholder("e.g., --port 8080")
          .setValue(mcpServerCopy.args.join("\n"))
          .onChange((value) => {
            mcpServerCopy.args = value.split("\n").filter((arg) =>
              arg.trim() !== ""
            );
          });
      });

    new Setting(this.contentEl)
      .setName("Environment variables")
      .setDesc("Edit the environment variables for the MCP server")
      .addTextArea((textArea) => {
        textArea
          .setPlaceholder("e.g., KEY=VALUE\nANOTHER_KEY=ANOTHER_VALUE")
          .setValue(
            Object.entries(mcpServerCopy.env)
              .map(([key, value]) => `${key}=${value}`)
              .join("\n"),
          )
          .onChange((value) => {
            const envEntries = value.split("\n").reduce((acc, line) => {
              const [key, ...rest] = line.split("=");
              if (key) {
                acc[key.trim()] = rest.join("=").trim();
              }
              return acc;
            }, {} as Record<string, string>);
            mcpServerCopy.env = envEntries;
          });
      });

    new Setting(this.contentEl)
      .addButton((button) => {
        button
          .setCta()
          .setButtonText("Save")
          .setTooltip("Save the MCP server settings")
          .onClick(() => {
            onSave?.(mcpServerCopy);
            this.close();
          });
      })
      .addButton((button) => {
        button
          .setButtonText("Cancel")
          .setTooltip("Cancel and close the settings")
          .onClick(() => {
            this.close();
          });
      });
  }
}
