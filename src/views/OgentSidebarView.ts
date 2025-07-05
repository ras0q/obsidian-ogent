import {
  ButtonComponent,
  ItemView,
  MarkdownRenderer,
  Notice,
  TextAreaComponent,
  WorkspaceLeaf,
} from "obsidian";
import { buildMastra } from "../mastra/index.ts";
import { buildObsidianAgent } from "../mastra/agents/obsidian-agent.ts";
import OgentPlugin from "../main.ts";

export class OgentSidebarView extends ItemView {
  static VIEW_TYPE = "ogent-chat-view";
  plugin: OgentPlugin;

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

    const model = await this.setupModel();
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
        const agent = buildObsidianAgent(
          this.app,
          model,
        );
        if (!agent) throw new Error("Agent not found");
        const response = await agent.stream(
          history.filter((msg) => msg.content !== ""),
          {
            maxSteps: 20,
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

  async setupModel() {
    const { provider, name, apiKey } = this.plugin.settings.model;
    if (!apiKey) {
      new Notice(
        "Ogent: API key is not set. Please configure it in the settings.",
      );
      return Promise.reject("API key is not set");
    }

    switch (provider) {
      case "openai": {
        globalThis.process.env.OPENAI_API_KEY = apiKey;
        const { openai } = await import("https://esm.sh/@ai-sdk/openai");
        return openai(name);
      }
      case "google": {
        globalThis.process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
        const { google } = await import("https://esm.sh/@ai-sdk/google");
        return google(name);
      }
      case "anthropic": {
        globalThis.process.env.ANTHROPIC_API_KEY = apiKey;
        const { anthropic } = await import("https://esm.sh/@ai-sdk/anthropic");
        return anthropic(name);
      }
      case "azure": {
        globalThis.process.env.AZURE_API_KEY = apiKey;
        const { azure } = await import("https://esm.sh/@ai-sdk/azure");
        return azure(name);
      }
      default:
        console.warn(
          `Unsupported provider: ${provider}. Feel free to submit a PR to support it!`,
        );
    }
  }
}

type Agent = ReturnType<typeof buildMastra>["getAgent"] extends // deno-lint-ignore no-explicit-any
(...args: any[]) => infer R ? NonNullable<R>
  : never;
type StreamResponse = ReturnType<Agent["stream"]> extends Promise<infer R> ? R
  : never;
type StreamPart = StreamResponse["fullStream"] extends AsyncIterable<infer U>
  ? U
  : never;
function parseStreamPart(part: StreamPart): {
  full: string;
  plain: string;
} {
  switch (part.type) {
    case "error": {
      const { isRetryable, data } = part.error as Record<string, unknown>;
      return {
        full: generateJSONCallout(
          "FAILURE",
          "Error",
          { isRetryable, data },
          true,
        ),
        plain: "",
      };
    }

    case "tool-call":
      return {
        full: generateJSONCallout(
          "IMPORTANT",
          `Tool Call (${part.toolName})`,
          part.args,
          true,
        ),
        plain: "",
      };

    case "tool-result":
      return {
        full: generateJSONCallout(
          "SUCCESS",
          `Tool Result (${part.toolName})`,
          part.result,
          true,
        ),
        plain: "",
      };

    case "text-delta":
      return {
        full: part.textDelta,
        plain: part.textDelta,
      };

    case "step-start":
    case "step-finish":
    case "finish":
      return {
        full: "",
        plain: "",
      };

    default:
      console.warn("Unknown part type:", part);
      return {
        full: `Unknown part type: ${part.type}`,
        plain: "",
      };
  }
}

function generateCallout(
  type: string,
  title: string,
  body: string,
  foldable: boolean,
) {
  return `> [!${type}]${foldable ? "-" : ""} ${title}
> ${body.replaceAll(/\n/g, "\n> ")}

`;
}

function generateJSONCallout(
  type: string,
  title: string,
  body: unknown,
  foldable: boolean,
) {
  return generateCallout(
    type,
    title,
    `\`\`\`json\n${JSON.stringify(body, null, 2)}\n\`\`\``,
    foldable,
  );
}
