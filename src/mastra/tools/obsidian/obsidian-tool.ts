import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { App } from "obsidian";
import { spawn } from "node:child_process";

export const buildObsidianTools = (app: App) => ({
  "obsidian-list-commands": createTool({
    id: "obsidian-list-commands",
    description: "List all available commands in Obsidian",
    inputSchema: z.object({}),
    outputSchema: z.object({
      commands: z.array(z.object({
        id: z.string().describe("The command ID"),
        name: z.string().describe("The command name"),
      })).describe("List of available commands"),
    }),
    execute: async () => {
      type AppCommands = {
        commands: Record<string, { id: string; name: string }>;
      };

      // @ts-ignore: app.commands is private in Obsidian
      const { commands }: AppCommands = app.commands;
      return await Promise.resolve({
        commands: Object.values(commands).map((command) => ({
          id: command.id,
          name: command.name,
        })),
      });
    },
  }),
  "obsidian-trigger-command": createTool({
    id: "obsidian-trigger-command",
    description: "Trigger a command in Obsidian",
    inputSchema: z.object({
      id: z.string().describe("The command to trigger"),
    }),
    outputSchema: z.object({
      success: z.boolean().describe(
        "Whether the command was successfully triggered",
      ),
    }),
    execute: async ({ context }) => {
      const { id } = context;
      // @ts-ignore: app.commands is private in Obsidian
      try {
        // @ts-ignore: app.commands.executeCommandById is private in Obsidian
        await app.commands.executeCommandById(id);
        return { success: true };
      } catch (error) {
        throw new Error(
          `Failed to execute command '${id}': ${error}`,
        );
      }
    },
  }),
  "obsidian-execute-shell-command": createTool({
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
  }),
});

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
