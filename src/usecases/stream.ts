import { Agent } from "@mastra/core";
import { generateJSONCallout } from "./callout.ts";

type StreamResponse = ReturnType<Agent["stream"]> extends Promise<infer R> ? R
  : never;
type StreamPart = StreamResponse["fullStream"] extends AsyncIterable<infer U>
  ? U
  : never;

type ParsedStreamPart = {
  full: string;
  plain: string;
};

export function parseStreamPart(part: StreamPart): ParsedStreamPart {
  switch (part.type) {
    case "error": {
      const { isRetryable, data } = part.error as Record<string, unknown>;
      return {
        full: generateJSONCallout(
          "FAILURE",
          "Error",
          { isRetryable, data },
          true,
        ),
        plain: "",
      };
    }

    case "tool-call":
      return {
        full: generateJSONCallout(
          "IMPORTANT",
          `Tool Call (${part.toolName})`,
          part.args,
          true,
        ),
        plain: "",
      };

    case "tool-result":
      return {
        full: generateJSONCallout(
          "SUCCESS",
          `Tool Result (${part.toolName})`,
          part.result,
          true,
        ),
        plain: "",
      };

    case "text-delta":
      return {
        full: part.textDelta,
        plain: part.textDelta,
      };

    case "step-start":
    case "step-finish":
    case "finish":
      return {
        full: "",
        plain: "",
      };

    default:
      console.warn("Unknown part type:", part);
      return {
        full: `Unknown part type: ${part.type}`,
        plain: "",
      };
  }
}
