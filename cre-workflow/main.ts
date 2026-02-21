/**
 * Kairos Finance - CRE Workflow Entry Point
 *
 * This workflow orchestrates AI-powered yield optimization for the Kairos Finance protocol.
 * It uses Chainlink CRE (Chainlink Runtime Environment) to:
 *
 * 1. Monitor KairosVault for StrategyRequested events (EVM Log Trigger)
 * 2. Read APY data from 4 lending protocols on Base via EVMClient
 * 3. Call Claude AI via HTTPClient for intelligent yield analysis
 * 4. Deliver recommendation on-chain via writeReport to KairosController
 * 5. Periodically check for rebalancing opportunities (Cron Trigger)
 *
 * Chainlink Products Used:
 * - CRE Workflow (orchestration)
 * - CRE EVMClient (on-chain reads from Aave, Compound, Moonwell)
 * - CRE HTTPClient (Claude API, Morpho GraphQL API)
 * - CRE writeReport (on-chain delivery)
 * - CRE Secrets (ANTHROPIC_API_KEY)
 * - Cron Trigger (periodic rebalance checks)
 *
 * @see https://docs.chain.link/cre for CRE documentation
 */

import { handleStrategyRequest, handleRebalanceCheck } from "./src/handler.js";

// ============================================================
// CRE Workflow Registration
// ============================================================
// In a full CRE deployment, this would use the CRE SDK:
//
// import { cre, type Runtime, type EvmLogPayload } from "@chainlink/cre-sdk";
//
// const initWorkflow = (config: Config) => {
//   const logTrigger = new cre.capabilities.EvmLogTriggerCapability();
//   const cronTrigger = new cre.capabilities.CronCapability();
//
//   return [
//     cre.handler(
//       logTrigger.trigger({
//         addresses: [config.vaultAddress],
//         topics: [STRATEGY_REQUESTED_TOPIC],
//       }),
//       async (runtime, payload) => {
//         // Read APY from protocols via EVMClient
//         const evmClient = new cre.capabilities.EvmClientCapability(BASE_CHAIN_SELECTOR);
//         const httpClient = new cre.capabilities.HttpClientCapability();
//
//         // ... fetch APY data, call Claude, encode recommendation ...
//
//         // Write recommendation on-chain
//         evmClient.writeReport(runtime, {
//           toAddress: config.controllerAddress,
//           data: encodedReport,
//         });
//       }
//     ),
//     cre.handler(
//       cronTrigger.trigger({ schedule: "0 0 */6 * * *" }),
//       async (runtime) => {
//         await handleRebalanceCheck();
//       }
//     ),
//   ];
// };
//
// export default { initWorkflow };
// ============================================================

// For simulation and demo purposes, we export the handlers directly
export { handleStrategyRequest, handleRebalanceCheck };

// CLI simulation entry point
async function main() {
  console.log("=== Kairos Finance CRE Workflow Simulation ===\n");

  // Simulate a rebalance check to demonstrate protocol data fetching
  await handleRebalanceCheck();

  console.log("\n=== Simulation Complete ===");
  console.log("In production, this workflow is triggered by:");
  console.log("  1. EVM Log Trigger: StrategyRequested events from KairosVault");
  console.log("  2. Cron Trigger: Every 6 hours for rebalance checks");
}

main().catch(console.error);
