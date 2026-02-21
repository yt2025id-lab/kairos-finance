/**
 * Kairos Finance CRE Workflow Handlers
 *
 * Core orchestration logic:
 * 1. Decode StrategyRequested event from EVM Log Trigger
 * 2. Read APY data from 4 lending protocols via EVMClient
 * 3. Call Claude AI via HTTPClient for intelligent yield analysis
 * 4. Encode recommendation and deliver on-chain via writeReport
 */

import {
  cre,
  bytesToHex,
  consensusIdenticalAggregation,
  prepareReportRequest,
  type Runtime,
  type NodeRuntime,
} from "@chainlink/cre-sdk";
import {
  encodeAbiParameters,
  parseAbiParameters,
  decodeAbiParameters,
  type Hex,
} from "viem";

import { readAaveAPY } from "./protocols/aave.js";
import { readCompoundAPY } from "./protocols/compound.js";
import { readMoonwellAPY } from "./protocols/moonwell.js";
import { analyzeAndRecommend } from "./ai/claude.js";
import { buildYieldAnalysisPrompt } from "./ai/prompts.js";
import { formatUSDC } from "./utils/encoding.js";
import type { ProtocolAPYData, AIRecommendation } from "./ai/types.js";
import type { Config } from "../main.js";
import { BASE_CHAIN_SELECTOR } from "../main.js";

// ============================================================
// Handler: StrategyRequested Event (EVM Log Trigger)
// ============================================================

export function onStrategyRequested(
  runtime: Runtime<Config>,
  log: { address: Uint8Array; txHash: Uint8Array; topics: Uint8Array[]; data: Uint8Array }
): string {
  runtime.log("[Kairos] StrategyRequested event detected");

  // 1. Decode event data
  const userTopic = bytesToHex(log.topics[1]);
  const user = ("0x" + userTopic.slice(26)) as `0x${string}`;

  const decoded = decodeAbiParameters(
    parseAbiParameters("uint256, uint256, uint256"),
    bytesToHex(log.data) as Hex
  );
  const amount = decoded[0];
  const timeHorizon = decoded[1];

  runtime.log(
    `[Kairos] User: ${user}, Amount: ${formatUSDC(amount)} USDC, Horizon: ${Number(timeHorizon) / 86400} days`
  );

  // 2. Create EVMClient for Base chain
  const evmClient = new cre.capabilities.EVMClient(BASE_CHAIN_SELECTOR);

  // 3. Read APY from on-chain protocols (DON-level via EVMClient)
  runtime.log("[Kairos] Reading APY data from on-chain protocols...");

  const aaveAPY = readAaveAPY(evmClient, runtime);
  runtime.log(`[Kairos] Aave V3: ${aaveAPY.apy.toFixed(2)}% APY`);

  const compoundAPY = readCompoundAPY(evmClient, runtime);
  runtime.log(`[Kairos] Compound V3: ${compoundAPY.apy.toFixed(2)}% APY`);

  const moonwellAPY = readMoonwellAPY(evmClient, runtime);
  runtime.log(`[Kairos] Moonwell: ${moonwellAPY.apy.toFixed(2)}% APY`);

  // 4. Get API key at DON level via CRE Secrets
  const apiKeySecret = runtime.getSecret({ id: "ANTHROPIC_API_KEY" }).result();
  const apiKey = String(apiKeySecret);

  // 5. Fetch Morpho APY + call Claude AI via HTTPClient (Node-level with consensus)
  runtime.log("[Kairos] Calling Morpho API + Claude AI via HTTPClient...");

  const protocols: ProtocolAPYData[] = [aaveAPY, compoundAPY, moonwellAPY];
  const prompt = buildYieldAnalysisPrompt(protocols, Number(timeHorizon), formatUSDC(amount));

  const recommendation = runtime.runInNodeMode(
    (nodeRuntime: NodeRuntime<Config>) => {
      return analyzeAndRecommend(nodeRuntime, protocols, prompt, apiKey);
    },
    consensusIdenticalAggregation<AIRecommendation>()
  )().result();

  runtime.log(
    `[Kairos] AI Recommendation: Protocol ${recommendation.protocolId}, APY ${recommendation.expectedAPY} bps, Confidence: ${recommendation.confidence}`
  );

  // 6. Encode recommendation for on-chain delivery
  const encodedPayload = encodeAbiParameters(
    parseAbiParameters("address, uint8, uint256, uint256, string"),
    [
      user,
      recommendation.protocolId,
      BigInt(recommendation.allocationBps),
      BigInt(recommendation.expectedAPY),
      recommendation.reasoning,
    ]
  );

  // 7. Generate signed report via DON consensus
  runtime.log("[Kairos] Generating signed report...");
  const reportRequest = prepareReportRequest(encodedPayload);
  const report = runtime.report(reportRequest).result();

  // 8. Deliver on-chain to KairosController via writeReport
  runtime.log("[Kairos] Writing report on-chain to KairosController...");
  evmClient.writeReport(runtime, {
    receiver: runtime.config.controllerAddress,
    report: report,
    gasConfig: { gasLimit: "500000" },
  }).result();

  runtime.log("[Kairos] Report delivered successfully");
  return "Strategy recommendation delivered";
}

// ============================================================
// Handler: Rebalance Check (Cron Trigger)
// ============================================================

export function onRebalanceCheck(runtime: Runtime<Config>): string {
  runtime.log("[Kairos] Running periodic rebalance check...");

  const evmClient = new cre.capabilities.EVMClient(BASE_CHAIN_SELECTOR);

  const aave = readAaveAPY(evmClient, runtime);
  const compound = readCompoundAPY(evmClient, runtime);
  const moonwell = readMoonwellAPY(evmClient, runtime);

  runtime.log("[Kairos] Current protocol APYs:");
  runtime.log(`  Aave V3:     ${aave.apy.toFixed(2)}% (TVL: ${aave.tvl})`);
  runtime.log(`  Compound V3: ${compound.apy.toFixed(2)}% (TVL: ${compound.tvl})`);
  runtime.log(`  Moonwell:    ${moonwell.apy.toFixed(2)}% (TVL: ${moonwell.tvl})`);

  runtime.log("[Kairos] Rebalance check complete");
  return "complete";
}
