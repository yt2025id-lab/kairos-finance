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
// Network Configuration (Staging = Base Sepolia, Prod = Base)
// ============================================================

/**
 * Determine network based on config file:
 * - config.staging.json → Base Sepolia (testnet)
 * - config.json → Base Mainnet (production)
 *
 * CRE SDK chain selectors:
 * - Base Sepolia: "ethereum-testnet-base-sepolia-1" (chainId: 84532)
 * - Base Mainnet: "ethereum-mainnet-base-1" (chainId: 8453)
 */
function getBaseNetwork(): ReturnType<typeof getNetwork> {
  // Check if we're using staging config (file name or env)
  const isStaging = process.env.CRE_CONFIG_FILE?.includes("staging") ?? true;

  const networkConfig = {
    chainFamily: "evm" as const,
    chainSelectorName: isStaging
      ? "ethereum-testnet-base-sepolia-1"
      : "ethereum-mainnet-base-1",
    isTestnet: isStaging,
  };

  const network = getNetwork(networkConfig);

  if (!network) {
    throw new Error(
      `Base ${isStaging ? "Sepolia" : "Mainnet"} network not found in CRE SDK. ` +
      `Check network availability at https://docs.chain.link/chainlink-functions/supported-networks`
    );
  }

  console.log(
    `[Kairos] Using Base ${isStaging ? "Sepolia (testnet)" : "Mainnet (production)"} - ` +
    `Chain ID: ${networkConfig.chainSelectorName}`
  );

  return network;
}

const BASE_NETWORK = getBaseNetwork();
export const BASE_CHAIN_SELECTOR = BASE_NETWORK!.chainSelector.selector;

/**
 * Base Mainnet chain selector — used for live APY reads from Aave/Compound/Moonwell.
 * Protocol contracts only exist on mainnet, even when the vault/controller are on Sepolia.
 * Falls back to BASE_CHAIN_SELECTOR if mainnet network is unavailable.
 */
function getMainnetSelector(): bigint {
  const mainnet = getNetwork({
    chainFamily: "evm",
    chainSelectorName: "ethereum-mainnet-base-1",
    isTestnet: false,
  });
  return mainnet?.chainSelector.selector ?? BASE_CHAIN_SELECTOR;
}

export const BASE_MAINNET_CHAIN_SELECTOR = getMainnetSelector();

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
