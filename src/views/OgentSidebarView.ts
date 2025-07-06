import {
  ButtonComponent,
  ItemView,
  MarkdownRenderer,
  Notice,
  TextAreaComponent,
  WorkspaceLeaf,
} from "obsidian";
import { buildObsidianAgent } from "../mastra/agents/obsidian-agent.ts";
import OgentPlugin from "../main.ts";
import { MCPClient } from "@mastra/mcp";
import { generateJSONCallout } from "../usecases/callout.ts";
import { parseStreamPart } from "../usecases/stream.ts";
import { setupModel } from "../usecases/lazymodel.ts";
import { Agent } from "@mastra/core";
import { McpToolsets, OgentMcpToolsModal } from "./OgentToolsetsModal.ts";

export class OgentSidebarView extends ItemView {
  static VIEW_TYPE = "ogent-chat-view";
  plugin: OgentPlugin;
  mcpClient: MCPClient | null = null;
  // deno-lint-ignore no-explicit-any
  toolsets: Record<string, Record<string, any>> | null = null;
  agent: Agent | null = null;

  constructor(leaf: WorkspaceLeaf, plugin: OgentPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType() {
    return OgentSidebarView.VIEW_TYPE;
  }

  getDisplayText() {
    return "Ogent";
  }

  override async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass("ogent-chat-container");

    const historyBox = container.createDiv({ cls: "ogent-chat-history" });
    const inputContainer = container.createDiv({
      cls: "ogent-input-container",
    });

    const toolsetsButton = new ButtonComponent(inputContainer);
    toolsetsButton.setButtonText("Manage tools")
      .onClick(async () => {
        if (!this.mcpClient) {
          this.mcpClient = new MCPClient({
            servers: this.plugin.settings.mcpServers,
          });
        }

        // reload toolsets
        const notice = new Notice("Reloading toolsets...");
        this.toolsets = await this.mcpClient.getToolsets();
        notice.hide();

        new OgentMcpToolsModal(
          this.app,
          this.toolsets,
          this.plugin.settings.disabledToolIds,
          async (disabledToolIds) => {
            this.plugin.settings.disabledToolIds = disabledToolIds;
            await this.plugin.saveSettings();
          },
        ).open();
      });

    const textInput = new TextAreaComponent(inputContainer);
    textInput.setPlaceholder("Enter message...");

    const sendButton = new ButtonComponent(inputContainer);
    sendButton.setButtonText("Send")
      .setCta()
      .setTooltip("Send message")
      .onClick(() => {
        sendMessage();
      });

    const history: { role: "user" | "assistant"; content: string }[] = [];

    const apiKey = this.app.loadLocalStorage("ogent-api-key");
    if (!apiKey) {
      new Notice(
        "Ogent: API key is not set. Please configure it in the settings.",
      );
      return;
    }

    const model = await setupModel(this.plugin.settings.model, apiKey);
    if (!model) {
      new Notice("Ogent: Model cannot be set up.");
      return;
    }

    const sendMessage = async () => {
      const text = textInput.getValue().trim();
      if (!text) return;
      textInput.setValue("");
      history.push({ role: "user", content: text });

      const userEl = historyBox.createDiv({ cls: "ogent-user-message" });
      MarkdownRenderer.render(
        this.app,
        text,
        userEl,
        ".",
        this,
      );

      sendButton.setDisabled(true);

      let displayText = "";
      let plaintext = "";
      try {
        if (!this.mcpClient) {
          this.mcpClient = new MCPClient({
            servers: this.plugin.settings.mcpServers,
          });
        }
        if (!this.toolsets) {
          const notice = new Notice("Loading toolsets...");
          this.toolsets = await this.mcpClient.getToolsets();
          notice.hide();
        }
        if (!this.agent) {
          this.agent = buildObsidianAgent(
            this.plugin,
            model,
          );
        }

        const enabledToolsets: McpToolsets = {};
        for (const toolsetName in this.toolsets) {
          const toolset = this.toolsets[toolsetName];
          enabledToolsets[toolsetName] = {};
          for (const toolName in toolset) {
            const tool = toolset[toolName];
            if (!this.plugin.settings.disabledToolIds.includes(tool.id)) {
              enabledToolsets[toolsetName][tool.id] = tool;
            }
          }
        }

        const response = await this.agent.stream(
          history.filter((msg) => msg.content !== ""),
          {
            maxSteps: 20,
            toolsets: enabledToolsets,
          },
        );

        const assistantEl = historyBox.createDiv({
          cls: "ogent-assistant-message",
        });
        for await (const part of response.fullStream) {
          const { full, plain } = parseStreamPart(part);
          displayText += full;
          plaintext += plain;

          assistantEl.empty();
          MarkdownRenderer.render(
            this.app,
            displayText,
            assistantEl,
            ".",
            this,
          );
          historyBox.scrollTo({
            top: historyBox.scrollHeight,
            behavior: "smooth",
          });
        }
        history.push({ role: "assistant", content: plaintext });
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        displayText += generateJSONCallout(
          "FAILURE",
          "Error",
          { message: errMsg },
          true,
        );
        plaintext = `Error: ${errMsg}`;

        history.push({ role: "assistant", content: plaintext });
        const errorEl = historyBox.createDiv();
        MarkdownRenderer.render(
          this.app,
          displayText,
          errorEl,
          ".",
          this,
        );
        console.error("Error during message processing:", e);
      } finally {
        sendButton.setDisabled(false);
        textInput.inputEl.focus();
      }
    };

    return await Promise.resolve();
  }
}
