/**
 * Claude AI integration via CRE HTTPClient + Secrets
 *
 * Called inside runtime.runInNodeMode() to access secrets and HTTP.
 * Fetches Morpho APY via HTTP, then calls Claude API with all protocol data.
 */

import { cre, type NodeRuntime } from "@chainlink/cre-sdk";
import { readMorphoAPY } from "../protocols/morpho.js";
import type { AIAnalysis, ProtocolAPYData } from "./types.js";

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-6";

function clampScore(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/**
 * Fetch Morpho APY via HTTP and call Claude AI for yield analysis.
 * Must be called inside runtime.runInNodeMode().
 */
export function analyzeAndRecommend(
  nodeRuntime: NodeRuntime<any>,
  onChainProtocols: ProtocolAPYData[],
  prompt: string,
  apiKey: string
): AIAnalysis {
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
        max_tokens: 2048,
        messages: [{ role: "user", content: fullPrompt }],
      })
    ),
  }).result();

  if (response.statusCode !== 200) {
    const body = new TextDecoder().decode(response.body).slice(0, 300);
    throw new Error(`Claude API error ${response.statusCode}: ${body}`);
  }

  let data: any;
  try {
    data = JSON.parse(new TextDecoder().decode(response.body));
  } catch {
    throw new Error("Failed to parse Claude API response as JSON");
  }

  if (!data?.content?.[0]?.text) {
    throw new Error("Claude response missing content[0].text");
  }

  // Strip markdown code fences if Claude wraps the JSON
  let text: string = data.content[0].text.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  // 4. Parse and validate the analysis
  let raw: any;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(`Claude returned non-JSON: ${text.slice(0, 200)}`);
  }

  const analysis: AIAnalysis = {
    protocolId: raw.protocolId,
    allocationBps: raw.allocationBps ?? 10000,
    expectedAPY: raw.expectedAPY,
    confidence: clampScore(raw.confidence),
    riskScore: clampScore(raw.riskScore),
    reasoning: raw.reasoning ?? "",
    scores: Array.isArray(raw.scores)
      ? raw.scores.map((s: any) => ({
          protocolId: s.protocolId ?? 0,
          name: s.name ?? "",
          apyScore: clampScore(s.apyScore),
          safetyScore: clampScore(s.safetyScore),
          tvlScore: clampScore(s.tvlScore),
          stabilityScore: clampScore(s.stabilityScore),
          weightedTotal: clampScore(s.weightedTotal),
        }))
      : [],
    alternatives: Array.isArray(raw.alternatives)
      ? raw.alternatives.map((a: any) => ({
          protocolId: a.protocolId ?? 0,
          name: a.name ?? "",
          expectedAPY: a.expectedAPY ?? 0,
          weightedScore: clampScore(a.weightedScore),
          reason: a.reason ?? "",
        }))
      : [],
  };

  if (
    analysis.protocolId < 0 ||
    analysis.protocolId > 3 ||
    analysis.allocationBps <= 0 ||
    analysis.allocationBps > 10000
  ) {
    throw new Error(`Invalid recommendation from Claude: ${text}`);
  }

  return analysis;
}
