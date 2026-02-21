# Chainlink Integration - Kairos Finance

This document details every Chainlink technology used in Kairos Finance, with direct links to the relevant source files.

## CRE Workflow (Core Orchestration)

The Chainlink Runtime Environment (CRE) is the orchestration backbone of Kairos Finance. It connects on-chain events to AI analysis to on-chain execution in a single, verifiable workflow.

**Configuration**: [cre-workflow/workflow.yaml](../cre-workflow/workflow.yaml)
**Entry Point**: [cre-workflow/main.ts](../cre-workflow/main.ts)
**Handler**: [cre-workflow/src/handler.ts](../cre-workflow/src/handler.ts)

---

## 1. CRE EVM Log Trigger

**Purpose**: Monitors the KairosVault contract for `StrategyRequested` events.

**How it works**: When a user calls `requestStrategy(timeHorizon)` on the vault, it emits a `StrategyRequested(address user, uint256 amount, uint256 timeHorizon, uint256 timestamp)` event. The CRE EVM Log Trigger detects this event and initiates the workflow.

**Files**:
- Event emission: [contracts/src/vault/KairosVault.sol](../contracts/src/vault/KairosVault.sol) (line ~94)
- Trigger config: [cre-workflow/workflow.yaml](../cre-workflow/workflow.yaml)
- Event decoding: [cre-workflow/src/utils/encoding.ts](../cre-workflow/src/utils/encoding.ts)

---

## 2. CRE EVMClient (On-Chain Reads)

**Purpose**: Reads live APY data directly from lending protocol contracts on Base.

**Protocols read on-chain**:

| Protocol | Contract Read | Function | File |
|----------|---------------|----------|------|
| Aave V3 | PoolDataProvider | `getReserveData(USDC)` -> `liquidityRate` | [protocols/aave.ts](../cre-workflow/src/protocols/aave.ts) |
| Compound V3 | Comet | `getUtilization()` + `getSupplyRate(utilization)` | [protocols/compound.ts](../cre-workflow/src/protocols/compound.ts) |
| Moonwell | mUSDC | `supplyRatePerTimestamp()` + `exchangeRateStored()` | [protocols/moonwell.ts](../cre-workflow/src/protocols/moonwell.ts) |

Each protocol reader normalizes the rate to a percentage APY and calculates TVL.

---

## 3. CRE HTTPClient (External API Calls)

**Purpose**: Calls external APIs that cannot be accessed on-chain.

### 3a. Morpho GraphQL API
Morpho does not expose a simple on-chain APY view function. The CRE workflow uses HTTPClient to query Morpho's public GraphQL API for USDC market data on Base.

**File**: [cre-workflow/src/protocols/morpho.ts](../cre-workflow/src/protocols/morpho.ts)
**Endpoint**: `https://blue-api.morpho.org/graphql`

### 3b. Claude AI API (Anthropic)
The core AI analysis. The workflow sends structured protocol data and the user's parameters to Claude, which returns a JSON recommendation.

**File**: [cre-workflow/src/ai/claude.ts](../cre-workflow/src/ai/claude.ts)
**Prompt Template**: [cre-workflow/src/ai/prompts.ts](../cre-workflow/src/ai/prompts.ts)
**Endpoint**: `https://api.anthropic.com/v1/messages`

---

## 4. CRE writeReport (On-Chain Delivery)

**Purpose**: Delivers the AI recommendation on-chain to the KairosController contract.

**How it works**: The encoded recommendation (user, protocolId, allocationBps, expectedAPY, reasoning) is written on-chain via the Chainlink Forwarder to the `KairosController.onReport()` function.

**Files**:
- Report encoding: [cre-workflow/src/utils/encoding.ts](../cre-workflow/src/utils/encoding.ts)
- Report delivery: [cre-workflow/src/handler.ts](../cre-workflow/src/handler.ts) (line ~65)
- On-chain receiver: [contracts/src/controller/KairosController.sol](../contracts/src/controller/KairosController.sol)
- IReceiver interface: [contracts/src/interfaces/IReceiver.sol](../contracts/src/interfaces/IReceiver.sol)

---

## 5. CRE Secrets Management

**Purpose**: Securely stores the Anthropic API key used by the Claude AI integration.

**File**: [cre-workflow/secrets.yaml](../cre-workflow/secrets.yaml)

The API key is accessed at runtime via `runtime.getSecret("ANTHROPIC_API_KEY")` and never exposed in the workflow code or on-chain.

---

## 6. CRE Cron Trigger (Rebalancing)

**Purpose**: Periodically checks if active positions should be rebalanced to a better protocol.

**Schedule**: Every 6 hours (`0 0 */6 * * *`)

**How it works**: The cron trigger initiates a check that reads current APY data from all protocols and compares it against active positions. If a significantly better option is available (>1% APY difference), it can trigger a rebalance recommendation.

**File**: [cre-workflow/main.ts](../cre-workflow/main.ts) (rebalance handler)
**Handler**: [cre-workflow/src/handler.ts](../cre-workflow/src/handler.ts) (`handleRebalanceCheck`)

---

## Data Flow Summary

```
StrategyRequested event (EVM Log Trigger)
    |
    v
EVMClient.callContract() x3 (Aave, Compound, Moonwell)
HTTPClient.sendRequest() (Morpho GraphQL)
    |
    v
HTTPClient.sendRequest() (Claude AI API)
    |  uses: runtime.getSecret("ANTHROPIC_API_KEY")
    v
writeReport() -> KairosController.onReport()
    |
    v
Strategy execution on-chain
```

Every step runs on the Chainlink Decentralized Oracle Network with Byzantine Fault Tolerant consensus.
