import {
  ButtonComponent,
  ItemView,
  MarkdownRenderer,
  TextAreaComponent,
  WorkspaceLeaf,
} from "obsidian";
import { buildMastra } from "../mastra/index.ts";

export class OgentSidebarView extends ItemView {
  static VIEW_TYPE = "ogent-chat-view";

  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
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
        const agent = buildMastra(this.app).getAgent("obsidianAgent");
        if (!agent) throw new Error("Agent not found");
        const response = await agent.stream(history);

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
