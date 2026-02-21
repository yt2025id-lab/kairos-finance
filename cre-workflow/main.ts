/**
 * Kairos Finance - CRE Workflow Entry Point
 *
 * AI-powered yield optimization orchestrated by Chainlink CRE.
 * Monitors KairosVault for StrategyRequested events, reads live APY
 * from 4 lending protocols on Base, calls Claude AI for analysis,
 * and delivers the recommendation on-chain.
 *
 * Chainlink Products Used:
 * - CRE Workflow (orchestration)
 * - CRE EVMClient (on-chain reads + writes)
 * - CRE HTTPClient (Claude API + Morpho GraphQL)
 * - CRE Secrets (ANTHROPIC_API_KEY)
 * - CRE Cron Trigger (periodic rebalance checks)
 * - CRE EVM Log Trigger (StrategyRequested events)
 *
 * @see https://docs.chain.link/cre
 */

import {
  cre,
  Runner,
  hexToBase64,
  getNetwork,
} from "@chainlink/cre-sdk";
import { z } from "zod";
import { keccak256, toHex } from "viem";

import { onStrategyRequested, onRebalanceCheck } from "./src/handler.js";

// ============================================================
// Config Schema (validated at runtime by CRE)
// ============================================================

export const configSchema = z.object({
  schedule: z.string(),
  vaultAddress: z.string(),
  controllerAddress: z.string(),
  anthropicApiUrl: z.string(),
});

export type Config = z.infer<typeof configSchema>;

// ============================================================
// Network Configuration
// ============================================================

const BASE_NETWORK = getNetwork({
  chainFamily: "evm",
  chainSelectorName: "ethereum-mainnet-base-1",
  isTestnet: false,
});

if (!BASE_NETWORK) {
  throw new Error("Base network not found in CRE SDK");
}

export const BASE_CHAIN_SELECTOR = BASE_NETWORK.chainSelector.selector;

// ============================================================
// Event Signature
// ============================================================

export const STRATEGY_REQUESTED_TOPIC = keccak256(
  toHex("StrategyRequested(address,uint256,uint256,uint256)")
);

// ============================================================
// Workflow Registration
// ============================================================

const initWorkflow = (config: Config) => {
  const evmClient = new cre.capabilities.EVMClient(BASE_CHAIN_SELECTOR);
  const cron = new cre.capabilities.CronCapability();

  return [
    // Trigger 1: EVM Log Trigger — fires when user requests yield optimization
    cre.handler(
      evmClient.logTrigger({
        addresses: [hexToBase64(config.vaultAddress as `0x${string}`)],
        topics: [
          { values: [hexToBase64(STRATEGY_REQUESTED_TOPIC)] },
          { values: [] }, // wildcard: any user address
        ],
      }),
      onStrategyRequested
    ),

    // Trigger 2: Cron — periodic rebalance check
    cre.handler(
      cron.trigger({ schedule: config.schedule }),
      onRebalanceCheck
    ),
  ];
};

// ============================================================
// Entry Point
// ============================================================

export async function main() {
  const runner = await Runner.newRunner<Config>({ configSchema });
  await runner.run(initWorkflow);
}

main();
