export const supportedProviders = [
  "openai",
  "google",
  "anthropic",
  "azure",
  "custom",
] as const;
export type ModelProvider = typeof supportedProviders[number];
