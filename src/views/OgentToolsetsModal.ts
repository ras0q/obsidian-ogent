import { App, Modal, Setting } from "obsidian";

// deno-lint-ignore no-explicit-any
export type McpToolsets = Record<string, Record<string, any>>;

export class OgentMcpToolsModal extends Modal {
  constructor(
    app: App,
    toolsets: McpToolsets,
    disabledToolIds: string[],
    onSave?: (disabledToolIds: string[]) => void,
  ) {
    super(app);
    this.setTitle("Manage Toolsets");

    const disabledToolIdsCopy = disabledToolIds.slice();

    for (const toolsetName in toolsets) {
      const toolset = toolsets[toolsetName];
      const detailsEl = this.contentEl.createEl("details");
      const summaryEl = detailsEl.createEl("summary");
      summaryEl.createEl("h4", {
        text: toolsetName,
        cls: "ogent-toolset-title",
      });

      for (const toolName in toolset) {
        const tool = toolset[toolName];
        new Setting(detailsEl)
          .setName(`${toolName} (${tool.id})`)
          .setDesc(tool.description || "No description provided")
          .addToggle((toggle) => {
            toggle
              .setValue(!disabledToolIdsCopy.includes(tool.id))
              .onChange((value) => {
                if (value) {
                  disabledToolIdsCopy.splice(
                    disabledToolIdsCopy.indexOf(tool.id),
                    1,
                  );
                } else {
                  disabledToolIdsCopy.push(tool.id);
                }
                onSave?.(disabledToolIdsCopy);
              });
          });
      }
    }
  }
}
