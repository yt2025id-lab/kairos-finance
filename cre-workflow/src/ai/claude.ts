/**
 * Claude AI integration via CRE HTTPClient + Secrets
 *
 * Called inside runtime.runInNodeMode() to access secrets and HTTP.
 * Fetches Morpho APY via HTTP, then calls Claude API with all protocol data.
 */

import { cre, type NodeRuntime } from "@chainlink/cre-sdk";
import { readMorphoAPY } from "../protocols/morpho.js";
import { AIRecommendationSchema } from "./types.js";
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
  nodeRuntime.log("[Claude] Starting yield analysis...");

  // Validate API key
  if (!apiKey || apiKey.length === 0) {
    throw new Error("[Claude] API key is empty or invalid");
  }

  // 1. Fetch Morpho APY via HTTP
  let morphoData: ProtocolAPYData;
  try {
    nodeRuntime.log("[Claude] 📡 Fetching Morpho APY via HTTP...");
    morphoData = readMorphoAPY(nodeRuntime);
    nodeRuntime.log(`[Claude] ✅ Morpho APY: ${morphoData.apy.toFixed(2)}% (TVL: ${morphoData.tvl})`);
  } catch (morphoErr) {
    nodeRuntime.log(
      `[Claude] ⚠️  Morpho fetch failed: ${morphoErr instanceof Error ? morphoErr.message : String(morphoErr)}. Continuing with on-chain data only.`
    );
    // Fallback: use zero-APY Morpho placeholder
    morphoData = { name: "Morpho", protocolId: 4, apy: 0, tvl: "N/A (fetch error)" };
  }

  // 2. Build complete prompt with Morpho data
  const fullPrompt =
    prompt +
    `\n\n${onChainProtocols.length + 1}. ${morphoData.name}:\n   - Current Supply APY: ${morphoData.apy.toFixed(2)}%\n   - TVL: ${morphoData.tvl}\n   - Protocol ID: ${morphoData.protocolId}`;

  // 3. Call Claude API via HTTPClient
  nodeRuntime.log("[Claude] 🤖 Calling Anthropic Claude API...");
  const httpClient = new cre.capabilities.HTTPClient();

  const requestBody = JSON.stringify({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [{ role: "user", content: fullPrompt }],
  });

  let response;
  try {
    response = httpClient.sendRequest(nodeRuntime, {
      url: CLAUDE_API_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: btoa(requestBody),
    }).result();
  } catch (httpErr) {
    throw new Error(
      `HTTP request failed: ${httpErr instanceof Error ? httpErr.message : String(httpErr)}`
    );
  }

  if (response.statusCode !== 200) {
    const body = new TextDecoder().decode(response.body).slice(0, 300);
    throw new Error(
      `Claude API error ${response.statusCode}: ${body}. ` +
      `Check API key validity at https://console.anthropic.com`
    );
  }

  // 4. Parse Claude response
  let data: any;
  try {
    data = JSON.parse(new TextDecoder().decode(response.body));
  } catch (parseErr) {
    throw new Error(
      `Failed to parse Claude API response: ${parseErr instanceof Error ? parseErr.message : String(parseErr)}`
    );
  }

  // Extract text from Claude response
  if (!data.content || !Array.isArray(data.content) || data.content.length === 0) {
    throw new Error("[Claude] Invalid response structure: missing content array");
  }

  let text: string = (data.content[0] as any).text?.trim();
  if (!text) {
    throw new Error("[Claude] Invalid response: empty text content");
  }

  nodeRuntime.log(`[Claude] ✅ Claude response received (${text.length} chars)`);

  // 5. Strip markdown code fences if Claude wraps the JSON
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    text = fenceMatch[1].trim();
    nodeRuntime.log("[Claude] 📝 Extracted JSON from markdown fence");
  }

  // 6. Parse JSON with explicit error handling
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (jsonErr) {
    throw new Error(
      `Claude returned non-JSON response: ${text.slice(0, 200)}... ` +
      `(${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)})`
    );
  }

  // 7. Validate schema with zod
  const result = AIRecommendationSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Claude response failed schema validation: ${issues}`);
  }

  nodeRuntime.log(
    `[Claude] ✅ Recommendation validated: ` +
    `Protocol ${result.data.protocolId}, APY ${result.data.expectedAPY}, Confidence ${result.data.confidence}`
  );

  return result.data;
}
