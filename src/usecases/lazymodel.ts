import { Notice } from "obsidian";
import { MastraLanguageModel } from "@mastra/core";
import { OgentPluginSettings } from "../main.ts";

export async function setupModel(
  modelSettings: OgentPluginSettings["model"],
  apiKey: string,
): Promise<MastraLanguageModel> {
  const { provider, customProvider, name } = modelSettings;

  switch (provider) {
    case "openai": {
      globalThis.process.env.OPENAI_API_KEY = apiKey;
      const { openai } = await import("https://esm.sh/@ai-sdk/openai");
      return openai(name);
    }
    case "google": {
      const { google } = await import("https://esm.sh/@ai-sdk/google");
      globalThis.process.env.GOOGLE_GENERATIVE_AI_API_KEY = apiKey;
      return google(name);
    }
    case "anthropic": {
      const { anthropic } = await import("https://esm.sh/@ai-sdk/anthropic");
      globalThis.process.env.ANTHROPIC_API_KEY = apiKey;
      return anthropic(name);
    }
    case "azure": {
      const { azure } = await import("https://esm.sh/@ai-sdk/azure");
      globalThis.process.env.AZURE_API_KEY = apiKey;
      return azure(name);
    }
    case "ollama": {
      const { ollama } = await import("https://esm.sh/ollama-ai-provider");
      // Ollama does not require an API key
      return ollama(name);
    }
    case "custom": {
      if (
        !customProvider || !customProvider.name || !customProvider.apiKeyName
      ) {
        new Notice(
          "Ogent: Unsupported model provider. Please check your settings.",
        );
        return Promise.reject("Unsupported model provider");
      }

      console.warn(`Ogent: Dynamic importing ${customProvider.name}...`);
      const module = await import(
        `https://esm.sh/@ai-sdk/${customProvider.name}`
      );
      globalThis.process.env[customProvider.apiKeyName ?? "API_KEY"] = apiKey;
      const providerFunc = module[customProvider.name];
      return providerFunc(name);
    }
    default: {
      new Notice(
        "Ogent: Unsupported model provider. Please check your settings.",
      );
      return Promise.reject("Unsupported model provider");
    }
  }
}
