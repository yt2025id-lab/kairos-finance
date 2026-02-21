/**
 * Claude AI integration via CRE HTTPClient + Secrets
 *
 * Called inside runtime.runInNodeMode() to access secrets and HTTP.
 * Fetches Morpho APY via HTTP, then calls Claude API with all protocol data.
 */

import { cre, type NodeRuntime } from "@chainlink/cre-sdk";
import { readMorphoAPY } from "../protocols/morpho.js";
import type { AIRecommendation, ProtocolAPYData } from "./types.js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

/**
 * Fetch Morpho APY via HTTP and call Claude AI for yield analysis.
 * Must be called inside runtime.runInNodeMode().
 */
export function analyzeAndRecommend(
  nodeRuntime: NodeRuntime<any>,
  onChainProtocols: ProtocolAPYData[],
  prompt: string,
  apiKey: string
): AIRecommendation {
  // 1. Fetch Morpho APY via HTTPClient
  const morphoData = readMorphoAPY(nodeRuntime);

  // 2. Update prompt with Morpho data
  const fullPrompt = prompt + `\n\n${onChainProtocols.length + 1}. ${morphoData.name}:\n   - Current Supply APY: ${morphoData.apy.toFixed(2)}%\n   - TVL: ${morphoData.tvl}\n   - Protocol ID: ${morphoData.protocolId}`;

  // 3. Call Claude API via HTTPClient
  const httpClient = new cre.capabilities.HTTPClient();

  const response = httpClient.sendRequest(nodeRuntime, {
    url: CLAUDE_API_URL,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: btoa(
      JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        messages: [{ role: "user", content: fullPrompt }],
      })
    ),
  }).result();

  if (response.statusCode !== 200) {
    throw new Error(`Claude API error: ${response.statusCode}`);
  }

  const data = JSON.parse(new TextDecoder().decode(response.body));
  const text = data.content[0].text.trim();

  // 5. Parse and validate the recommendation
  const recommendation: AIRecommendation = JSON.parse(text);

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
