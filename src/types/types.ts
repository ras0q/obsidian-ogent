export const supportedProviders = [
  "openai",
  "google",
  "anthropic",
  "azure",
  "ollama",
  "custom",
] as const;
export type ModelProvider = typeof supportedProviders[number];
