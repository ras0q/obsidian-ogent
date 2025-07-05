import {
  ButtonComponent,
  ItemView,
  MarkdownRenderer,
  TextAreaComponent,
  WorkspaceLeaf,
} from "obsidian";
import { mastra } from "../mastra/index.ts";

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
        `User:\n${text}`,
        userEl,
        ".",
        this,
      );

      sendButton.setDisabled(true);
      try {
        const agent = mastra.getAgent("weatherAgent");
        if (!agent) throw new Error("Agent not found");
        const response = await agent.stream(
          history.flatMap((h) => {
            return h.role === "user"
              ? { role: "user" as const, content: h.content }
              : [];
          }),
        );

        const responseEl = historyBox.createDiv();
        let responseText = "Assistant:\n";
        for await (const chunk of response.textStream) {
          responseText += chunk;

          responseEl.empty();
          MarkdownRenderer.render(
            this.app,
            responseText,
            responseEl,
            ".",
            this,
          );
        }
        history.push({ role: "assistant", content: responseText });
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
