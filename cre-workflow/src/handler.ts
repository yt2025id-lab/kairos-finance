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
import type { ProtocolAPYData, AIAnalysis } from "./ai/types.js";
import type { Config } from "../main.js";
import { BASE_CHAIN_SELECTOR, BASE_MAINNET_CHAIN_SELECTOR } from "../main.js";

/** Return a zero-APY placeholder when a live protocol read fails. */
function makeProtocolFallback(name: string, protocolId: number): ProtocolAPYData {
  return { name, protocolId, apy: 0, tvl: "N/A (read error)" };
}

/**
 * Attempt to read protocol APY; log a warning and return a fallback on any error.
 * This prevents a single RPC failure from aborting the entire recommendation.
 */
function safeReadProtocol(
  label: string,
  protocolId: number,
  reader: () => ProtocolAPYData,
  runtime: Runtime<Config>
): { data: ProtocolAPYData; ok: boolean } {
  try {
    const data = reader();
    runtime.log(`[Kairos] ${label}: ${data.apy.toFixed(2)}% APY (TVL: ${data.tvl})`);
    return { data, ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    runtime.log(`[Kairos] WARNING: ${label} read failed — ${msg}. Using fallback (0% APY).`);
    return { data: makeProtocolFallback(label, protocolId), ok: false };
  }
}

// ============================================================
// Handler: StrategyRequested Event (EVM Log Trigger)
// ============================================================

export function onStrategyRequested(
  runtime: Runtime<Config>,
  log: { address: Uint8Array; txHash: Uint8Array; topics: Uint8Array[]; data: Uint8Array }
): string {
  try {
    runtime.log("[Kairos] ═══════════════════════════════════════");
    runtime.log("[Kairos] StrategyRequested event detected");
    runtime.log(`[Kairos] TX Hash: ${bytesToHex(log.txHash)}`);
    runtime.log("[Kairos] ═══════════════════════════════════════");

    // 1. Decode event data
    let user: `0x${string}`;
    let amount: bigint;
    let timeHorizon: bigint;

    try {
      const userTopic = bytesToHex(log.topics[1]);
      user = ("0x" + userTopic.slice(26)) as `0x${string}`;

      const decoded = decodeAbiParameters(
        parseAbiParameters("uint256, uint256, uint256"),
        bytesToHex(log.data) as Hex
      );
      amount = decoded[0] as bigint;
      timeHorizon = decoded[1] as bigint;

      runtime.log("[Kairos] 📊 Event Parameters:");
      runtime.log(`[Kairos]   User: ${user}`);
      runtime.log(`[Kairos]   Amount: ${formatUSDC(amount)} USDC`);
      runtime.log(`[Kairos]   Horizon: ${Number(timeHorizon) / 86400} days`);
    } catch (decodeErr) {
      throw new Error(
        `Failed to decode event data: ${decodeErr instanceof Error ? decodeErr.message : String(decodeErr)}`
      );
    }

    // 2. Create EVMClients:
    //    - evmClientMainnet: reads live APY from Base mainnet protocol contracts
    //    - evmClient: writes report to KairosController (staging=Sepolia, prod=mainnet)
    const evmClientMainnet = new cre.capabilities.EVMClient(BASE_MAINNET_CHAIN_SELECTOR);
    const evmClient = new cre.capabilities.EVMClient(BASE_CHAIN_SELECTOR);

    // 3. Read APY from on-chain protocols (always from Base mainnet — real liquidity data)
    runtime.log("[Kairos] 📈 Reading APY data from Base mainnet protocols...");

    const { data: aaveAPY, ok: aaveOk } = safeReadProtocol("Aave V3", 0, () => readAaveAPY(evmClientMainnet, runtime), runtime);
    const { data: compoundAPY, ok: compoundOk } = safeReadProtocol("Compound V3", 2, () => readCompoundAPY(evmClientMainnet, runtime), runtime);
    const { data: moonwellAPY, ok: moonwellOk } = safeReadProtocol("Moonwell", 3, () => readMoonwellAPY(evmClientMainnet, runtime), runtime);

    const successCount = [aaveOk, compoundOk, moonwellOk].filter(Boolean).length;
    if (successCount === 0) {
      throw new Error(
        "[Kairos] ❌ All on-chain protocol reads failed — cannot generate recommendation. " +
        "Check RPC connectivity and protocol contract addresses."
      );
    }
    runtime.log(`[Kairos] ✅ Successfully read ${successCount}/3 on-chain protocols`);

    // 4. Get API key at DON level via CRE Secrets
    runtime.log("[Kairos] 🔑 Retrieving ANTHROPIC_API_KEY from CRE Secrets...");
    let apiKey: string;
    try {
      const apiKeySecret = runtime.getSecret({ id: "ANTHROPIC_API_KEY" }).result();
      apiKey = String(apiKeySecret);
      if (!apiKey || apiKey === "null" || apiKey === "undefined" || apiKey.length === 0) {
        throw new Error("Secret returned empty or invalid value");
      }
      runtime.log("[Kairos] ✅ ANTHROPIC_API_KEY loaded successfully");
    } catch (secretErr) {
      throw new Error(
        `Failed to retrieve ANTHROPIC_API_KEY secret: ${secretErr instanceof Error ? secretErr.message : String(secretErr)}. ` +
        `Ensure secret is configured in CRE dashboard: https://cre.chain.link/secrets`
      );
    }

    // 5. Fetch Morpho APY + call Claude AI via HTTPClient (Node-level with consensus)
    runtime.log("[Kairos] 🤖 Calling Claude AI for yield analysis...");

    const protocols: ProtocolAPYData[] = [aaveAPY, compoundAPY, moonwellAPY];
    const prompt = buildYieldAnalysisPrompt(protocols, Number(timeHorizon), formatUSDC(amount));

    let encodedPayload: Hex;
    try {
      const analysis = runtime.runInNodeMode(
        (nodeRuntime: NodeRuntime<Config>) => {
          return analyzeAndRecommend(nodeRuntime, protocols, prompt, apiKey);
        },
        consensusIdenticalAggregation<AIAnalysis>()
      )().result();

      runtime.log(
        `[Kairos] AI Recommendation: Protocol ${analysis.protocolId}, APY ${analysis.expectedAPY} bps, Confidence: ${analysis.confidence}/100, Risk: ${analysis.riskScore}/100`
      );

      // 6. Serialize full analysis as JSON into reasoning field (backward-compatible with on-chain encoding)
      const reasoningPayload = JSON.stringify({
        summary: analysis.reasoning,
        confidence: analysis.confidence,
        riskScore: analysis.riskScore,
        scores: analysis.scores,
        alternatives: analysis.alternatives,
      });

      encodedPayload = encodeAbiParameters(
        parseAbiParameters("address, uint8, uint256, uint256, string"),
        [
          user,
          analysis.protocolId,
          BigInt(analysis.allocationBps),
          BigInt(analysis.expectedAPY),
          reasoningPayload,
        ]
      );
    } catch (aiErr) {
      throw new Error(
        `Claude AI analysis failed: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}. ` +
        `Check Anthropic API key validity and request format.`
      );
    }

    // 7. Generate signed report via DON consensus
    runtime.log("[Kairos] 📝 Generating DON-signed report...");
    let reportResult: any;
    try {
      const reportRequest = prepareReportRequest(encodedPayload);
      reportResult = runtime.report(reportRequest).result();
      runtime.log(`[Kairos] ✅ Report generated and ready`);
    } catch (reportErr) {
      throw new Error(
        `Failed to generate report: ${reportErr instanceof Error ? reportErr.message : String(reportErr)}`
      );
    }

    // 8. Deliver on-chain to KairosController via writeReport
    runtime.log("[Kairos] 🔗 Writing report on-chain to KairosController...");
    try {
      evmClient.writeReport(runtime, {
        receiver: runtime.config.controllerAddress,
        report: reportResult,
        gasConfig: { gasLimit: "500000" },
      }).result();
      runtime.log(`[Kairos] ✅ Report delivered successfully to ${runtime.config.controllerAddress}`);
    } catch (writeErr) {
      throw new Error(
        `Failed to write report on-chain: ${writeErr instanceof Error ? writeErr.message : String(writeErr)}. ` +
        `Check KairosController exists at ${runtime.config.controllerAddress}`
      );
    }

    runtime.log("[Kairos] ═══════════════════════════════════════");
    runtime.log("[Kairos] ✨ Strategy recommendation delivered successfully");
    runtime.log("[Kairos] ═══════════════════════════════════════");
    return "Strategy recommendation delivered";

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    runtime.log("[Kairos] ❌ ERROR: " + errorMsg);
    runtime.log("[Kairos] ═══════════════════════════════════════");
    throw err;
  }
}

// ============================================================
// Handler: Rebalance Check (Cron Trigger)
// ============================================================

export function onRebalanceCheck(runtime: Runtime<Config>): string {
  try {
    runtime.log("[Kairos] ═══════════════════════════════════════");
    runtime.log("[Kairos] ⏱️  Running periodic rebalance check...");
    runtime.log("[Kairos] ═══════════════════════════════════════");

    const evmClientMainnet = new cre.capabilities.EVMClient(BASE_MAINNET_CHAIN_SELECTOR);

    runtime.log("[Kairos] 📈 Reading current protocol APYs from Base mainnet...");
    const { data: aave } = safeReadProtocol("Aave V3", 0, () => readAaveAPY(evmClientMainnet, runtime), runtime);
    const { data: compound } = safeReadProtocol("Compound V3", 2, () => readCompoundAPY(evmClientMainnet, runtime), runtime);
    const { data: moonwell } = safeReadProtocol("Moonwell", 3, () => readMoonwellAPY(evmClientMainnet, runtime), runtime);

    runtime.log("[Kairos] 📊 Current Market Snapshot:");
    runtime.log(`[Kairos]   Aave V3:     ${aave.apy.toFixed(2)}% APY (TVL: ${aave.tvl})`);
    runtime.log(`[Kairos]   Compound V3: ${compound.apy.toFixed(2)}% APY (TVL: ${compound.tvl})`);
    runtime.log(`[Kairos]   Moonwell:    ${moonwell.apy.toFixed(2)}% APY (TVL: ${moonwell.tvl})`);

    const maxAPY = Math.max(aave.apy, compound.apy, moonwell.apy);
    const topProtocol = 
      maxAPY === aave.apy ? "Aave V3" :
      maxAPY === compound.apy ? "Compound V3" : "Moonwell";

    runtime.log(`[Kairos] 🏆 Best yield: ${topProtocol} at ${maxAPY.toFixed(2)}%`);
    runtime.log("[Kairos] ═══════════════════════════════════════");
    runtime.log("[Kairos] ✅ Rebalance check complete");

    return "complete";

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    runtime.log("[Kairos] ❌ Rebalance check failed: " + errorMsg);
    return "failed";
  }
}
