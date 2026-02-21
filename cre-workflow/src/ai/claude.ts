import type { AIRecommendation, ClaudeAPIResponse, ProtocolAPYData } from "./types.js";
import { buildYieldAnalysisPrompt } from "./prompts.js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

export interface ClaudeAnalysisParams {
  protocols: ProtocolAPYData[];
  timeHorizonSeconds: number;
  depositAmount: string;
  apiKey: string;
}

export async function analyzeWithClaude(
  params: ClaudeAnalysisParams
): Promise<AIRecommendation> {
  const prompt = buildYieldAnalysisPrompt(
    params.protocols,
    params.timeHorizonSeconds,
    params.depositAmount
  );

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": params.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data: ClaudeAPIResponse = await response.json();
  const text = data.content[0].text.trim();

  // Parse the JSON recommendation
  const recommendation: AIRecommendation = JSON.parse(text);

  // Validate the recommendation
  if (
    recommendation.protocolId < 0 ||
    recommendation.protocolId > 3 ||
    recommendation.allocationBps <= 0 ||
    recommendation.allocationBps > 10000
  ) {
    throw new Error(`Invalid recommendation from Claude: ${text}`);
  }

  return recommendation;
}
