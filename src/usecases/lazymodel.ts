import { Notice } from "obsidian";
import { MastraLanguageModel } from "@mastra/core";
import { OgentPluginSettings } from "../main.ts";

export async function setupModel(
  modelSettings: OgentPluginSettings["model"],
): Promise<MastraLanguageModel> {
  const { provider, customProvider, name, apiKey } = modelSettings;
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
    default: {
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
  }
}
