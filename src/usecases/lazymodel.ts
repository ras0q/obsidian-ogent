import { Notice } from "obsidian";

export async function setupModel(modelSettings: {
  provider: string;
  name: string;
  apiKey?: string;
}) {
  const { provider, name, apiKey } = modelSettings;
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
