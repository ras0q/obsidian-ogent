import { ItemView, WorkspaceLeaf } from "obsidian";
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
    return "Ogent AI Agent";
  }

  override async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    const _title = container.createEl("h3", { text: "Ogent AI Agent" });

    // チャット履歴表示エリア
    const historyBox = container.createDiv({ cls: "ogent-chat-history" });
    historyBox.setAttr(
      "style",
      "height: 250px; overflow-y: auto; border: 1px solid #ccc; padding: 8px; margin-bottom: 8px;",
    );

    // 入力欄と送信ボタン
    const inputWrapper = container.createDiv({
      cls: "ogent-chat-input-wrapper",
    });
    const input = inputWrapper.createEl("input", {
      type: "text",
      placeholder: "メッセージを入力...",
    });
    input.setAttr("style", "width: 70%; margin-right: 8px;");
    const sendBtn = inputWrapper.createEl("button", { text: "送信" });

    // チャット履歴
    const history: { role: "user" | "assistant"; content: string }[] = [];

    // 履歴描画関数
    const renderHistory = () => {
      historyBox.empty();
      for (const msg of history) {
        const msgDiv = historyBox.createDiv({
          cls: `ogent-msg ogent-msg-${msg.role}`,
        });
        msgDiv.setText((msg.role === "user" ? "🧑 " : "🤖 ") + msg.content);
        msgDiv.setAttr("style", `margin-bottom: 4px; white-space: pre-wrap;`);
      }
      historyBox.scrollTop = historyBox.scrollHeight;
    };

    // 送信処理
    const sendMessage = async () => {
      const text = input.value.trim();
      if (!text) return;
      history.push({ role: "user", content: text });
      renderHistory();
      input.value = "";
      sendBtn.disabled = true;
      try {
        // Mastra Agent へ問い合わせ
        const agent = mastra.getAgent("weatherAgent");
        if (!agent) throw new Error("Agent not found");
        const response = await agent.stream(
          history
            .filter((h) => h.role === "user")
            .map((h) => ({ role: "user" as const, content: h.content })),
        );
        let aiMsg = "";
        for await (const chunk of response.textStream) {
          aiMsg += chunk;
          // 途中経過も表示したい場合はここでhistoryBoxに反映可能
        }
        history.push({ role: "assistant", content: aiMsg });
        renderHistory();
      } catch (e) {
        const errMsg = e instanceof Error ? e.message : String(e);
        history.push({ role: "assistant", content: `エラー: ${errMsg}` });
        renderHistory();
      } finally {
        sendBtn.disabled = false;
        input.focus();
      }
    };

    sendBtn.onclick = sendMessage;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendMessage();
    });
    input.focus();

    return await Promise.resolve();
  }

  override async onClose() {
    // クリーンアップ処理があればここに
  }
}
