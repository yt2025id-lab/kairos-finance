/**
 * Kairos Finance CRE Workflow Handler
 *
 * This is the core orchestration logic that:
 * 1. Decodes the StrategyRequested event
 * 2. Reads APY data from 4 lending protocols on Base
 * 3. Calls Claude AI for intelligent yield analysis
 * 4. Returns encoded recommendation for on-chain delivery
 */

import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import { fetchAllProtocolAPYs } from "./protocols/index.js";
import { analyzeWithClaude } from "./ai/claude.js";
import {
  decodeStrategyRequestedEvent,
  encodeRecommendation,
  formatUSDC,
} from "./utils/encoding.js";
import type { StrategyRequestEvent } from "./ai/types.js";

// Configuration
const BASE_RPC_URL = process.env.BASE_RPC_URL || "https://mainnet.base.org";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || "";

/**
 * Main handler for StrategyRequested events
 * Called by the CRE trigger when a user requests yield optimization
 */
export async function handleStrategyRequest(
  logData: `0x${string}`,
  logTopics: `0x${string}`[]
): Promise<`0x${string}`> {
  // 1. Decode the event
  const event = decodeStrategyRequestedEvent(logData, logTopics);
  console.log(
    `[Kairos] Strategy requested by ${event.user}, amount: ${formatUSDC(event.amount)} USDC, horizon: ${Number(event.timeHorizon) / 86400} days`
  );

  // 2. Create Base client for on-chain reads
  const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
  });

  // 3. Fetch APY data from all protocols in parallel
  console.log("[Kairos] Fetching APY data from 4 protocols...");
  const protocols = await fetchAllProtocolAPYs(client);
  console.log("[Kairos] Protocol data:", JSON.stringify(protocols, null, 2));

  // 4. Call Claude AI for analysis
  console.log("[Kairos] Calling Claude AI for yield analysis...");
  const recommendation = await analyzeWithClaude({
    protocols,
    timeHorizonSeconds: Number(event.timeHorizon),
    depositAmount: formatUSDC(event.amount),
    apiKey: ANTHROPIC_API_KEY,
  });

  console.log("[Kairos] AI Recommendation:", JSON.stringify(recommendation, null, 2));

  // 5. Encode recommendation for on-chain delivery
  const encodedReport = encodeRecommendation(
    event.user,
    recommendation.protocolId,
    recommendation.allocationBps,
    recommendation.expectedAPY,
    recommendation.reasoning
  );

  console.log(`[Kairos] Report encoded, delivering to KairosController...`);
  return encodedReport;
}

/**
 * Rebalance check handler (cron trigger)
 * Checks if any active positions should be rebalanced
 */
export async function handleRebalanceCheck(): Promise<void> {
  console.log("[Kairos] Running periodic rebalance check...");

  const client = createPublicClient({
    chain: base,
    transport: http(BASE_RPC_URL),
  });

  // Fetch current protocol APYs
  const protocols = await fetchAllProtocolAPYs(client);

  console.log("[Kairos] Current protocol APYs:");
  for (const p of protocols) {
    console.log(`  ${p.name}: ${p.apy.toFixed(2)}% (TVL: ${p.tvl})`);
  }

  // In production, this would:
  // 1. Read active positions from the vault contract
  // 2. Compare current APY vs the protocol they're deposited in
  // 3. If there's a significantly better option (>1% APY difference), trigger rebalance
  console.log("[Kairos] Rebalance check complete.");
}
