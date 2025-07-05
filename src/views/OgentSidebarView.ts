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

    const historyBox = container.createDiv();
    historyBox.style.height = "80%";
    historyBox.style.overflowY = "auto";

    const inputContainer = container.createDiv({ cls: "setting-item" });

    const textInput = new TextAreaComponent(inputContainer);
    textInput.inputEl.style.width = "100%";
    textInput.inputEl.style.minHeight = "3em";
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

      const userEl = historyBox.createDiv();
      MarkdownRenderer.render(
        this.app,
        `## 👨 User:\n${text}`,
        userEl,
        ".",
        this,
      );

      sendButton.setDisabled(true);
      try {
        const agent = buildMastra(this.app).getAgent("obsidianAgent");
        if (!agent) throw new Error("Agent not found");
        const response = await agent.stream(history);

        const responseEl = historyBox.createDiv();
        let displayText = "## 🤖 Assistant:\n";
        let plaintext = "";
        for await (const part of response.fullStream) {
          switch (part.type) {
            case "error": {
              const { isRetryable, data } = part.error as Record<
                string,
                unknown
              >;
              displayText += generateJSONCallout(
                "FAILURE",
                "Error",
                { isRetryable, data },
                true,
              );
              break;
            }
            case "tool-call": {
              displayText += generateJSONCallout(
                "IMPORTANT",
                `Tool Call (${part.toolName})`,
                part.args,
                true,
              );
              break;
            }
            case "tool-result": {
              displayText += generateJSONCallout(
                "SUCCESS",
                `Tool Result (${part.toolName})`,
                part.result,
                true,
              );
              break;
            }
            case "text-delta": {
              displayText += part.textDelta;
              plaintext += part.textDelta;
              break;
            }
            case "step-start":
              break;
            case "step-finish":
              break;
            case "finish":
              break;
            default:
              console.warn("Unknown part type:", part);
              displayText += `Unknown part type: ${part.type}`;
              break;
          }

          responseEl.empty();
          MarkdownRenderer.render(
            this.app,
            displayText,
            responseEl,
            ".",
            this,
          );
        }
        history.push({ role: "assistant", content: plaintext });
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        history.push({ role: "assistant", content: `エラー: ${errMsg}` });
        const errorEl = historyBox.createDiv();
        MarkdownRenderer.render(
          this.app,
          `Assistant:\nエラー: ${errMsg}`,
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

const generateJSONCallout = (
  type: string,
  title: string,
  body: unknown,
  foldable: boolean,
) => {
  return `> [!${type}]${foldable ? "-" : ""} ${title}
> \`\`\`json
> ${JSON.stringify(body, null, 2).replaceAll(/\n/g, "\n> ")}
> \`\`\`

`;
};
