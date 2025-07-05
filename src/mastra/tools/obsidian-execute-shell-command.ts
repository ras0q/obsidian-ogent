import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";
import { spawn } from "node:child_process";

function getShell() {
  return globalThis.process.platform === "win32" ? "pwsh.exe" : "bash";
}

function executeShellCommand(app: App, command: string, args: string[]) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(command, args, {
      // @ts-ignore: app.vault.adapter.basePath is private in Obsidian
      cwd: app.vault.adapter.basePath,
      shell: getShell(),
    });

    let output = "";
    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      output += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`Command failed with exit code ${code}\n${output}`));
      } else {
        resolve(output);
      }
    });
  });
}

export const obsidianExecuteShellCommandTool = (app: App) =>
  createTool({
    id: "obsidian-execute-shell-command",
    description: `Execute a shell command in Obsidian with ${getShell()}`,
    inputSchema: z.object({
      command: z.string().describe("The shell command to execute"),
      args: z.array(z.string()).describe("Arguments for the command"),
    }),
    outputSchema: z.object({
      output: z.string().describe("The output of the command"),
    }),
    execute: async ({ context }) => {
      const { command, args } = context;
      try {
        const output = await executeShellCommand(app, command, args);
        return { output };
      } catch (error) {
        throw new Error(
          `Failed to execute shell command '${command}': ${error}`,
        );
      }
    },
  });
