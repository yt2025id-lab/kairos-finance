# Kairos Finance

**AI-Powered Yield Optimization on Base, Orchestrated by Chainlink CRE**

Kairos Finance is a DeFi protocol that uses artificial intelligence to optimize lending yields on Base blockchain. Users deposit USDC, set a time horizon, and a Chainlink CRE workflow automatically analyzes four lending protocols using Claude AI to find the best risk-adjusted return.

> *Kairos* (Greek: the right moment) -- timing matters in yield optimization.

---

## Problem

DeFi users face a fragmented lending landscape. On Base alone, there are multiple lending protocols (Aave, Compound, Moonwell, Morpho), each with different APY rates that fluctuate constantly. Choosing the right protocol requires understanding rate mechanics, protocol risk, TVL depth, and how these factors change over different time horizons. Most users either pick one protocol and stick with it, or spend significant time manually comparing rates.

## Solution

Kairos Finance automates this decision. A Chainlink CRE workflow:
1. Reads live APY data directly from on-chain protocol contracts
2. Fetches additional data from off-chain APIs (Morpho GraphQL)
3. Sends this data to Claude AI with the user's time horizon for analysis
4. Delivers the recommendation on-chain for automatic execution

The user's funds are then deposited into the recommended protocol through type-safe strategy adapter contracts.

---

## Architecture

```
User deposits USDC into KairosVault (ERC-4626)
        |
        v
User calls requestStrategy(timeHorizon)
        |
        v
StrategyRequested event emitted
        |
        v
Chainlink CRE Workflow triggers (EVM Log Trigger)
        |
        +---> EVMClient reads Aave V3 getReserveData()
        +---> EVMClient reads Compound V3 getSupplyRate()
        +---> EVMClient reads Moonwell supplyRatePerTimestamp()
        +---> HTTPClient calls Morpho GraphQL API
        |
        v
CRE HTTPClient calls Claude AI API with:
  - Live APY data from 4 protocols
  - User's time horizon
  - Deposit amount
  - Risk analysis parameters
        |
        v
Claude returns structured recommendation (JSON)
        |
        v
CRE writeReport delivers recommendation to KairosController
        |
        v
KairosController decodes recommendation
        |
        v
Vault transfers USDC to strategy adapter
        |
        v
Strategy adapter deposits into recommended protocol
```

---

## Chainlink Integration

Kairos Finance uses six Chainlink products:

| Product | Usage | Files |
|---------|-------|-------|
| **CRE Workflow** | Core orchestration layer | [workflow.yaml](cre-workflow/workflow.yaml), [main.ts](cre-workflow/main.ts) |
| **CRE EVMClient** | On-chain reads from Aave, Compound, Moonwell | [handler.ts](cre-workflow/src/handler.ts), [protocols/](cre-workflow/src/protocols/) |
| **CRE HTTPClient** | Claude AI API + Morpho GraphQL API calls | [claude.ts](cre-workflow/src/ai/claude.ts), [morpho.ts](cre-workflow/src/protocols/morpho.ts) |
| **CRE writeReport** | On-chain delivery to KairosController | [handler.ts](cre-workflow/src/handler.ts) |
| **CRE Secrets** | Secure ANTHROPIC_API_KEY management | [secrets.yaml](cre-workflow/secrets.yaml) |
| **CRE Cron Trigger** | Periodic rebalancing checks (every 6 hours) | [main.ts](cre-workflow/main.ts) |

The CRE workflow is the central nervous system of Kairos Finance. It connects four Base lending protocols, an AI analysis service, and on-chain execution into a single verifiable pipeline.

---

## Smart Contracts

All contracts are built with Solidity 0.8.24 using Foundry.

| Contract | Description | Path |
|----------|-------------|------|
| `KairosVault` | ERC-4626 vault for user deposits, emits StrategyRequested events | [contracts/src/vault/KairosVault.sol](contracts/src/vault/KairosVault.sol) |
| `KairosController` | CRE IReceiver consumer, decodes AI recommendations, executes strategies | [contracts/src/controller/KairosController.sol](contracts/src/controller/KairosController.sol) |
| `AaveV3Strategy` | Strategy adapter for Aave V3 on Base | [contracts/src/strategies/AaveV3Strategy.sol](contracts/src/strategies/AaveV3Strategy.sol) |
| `CompoundV3Strategy` | Strategy adapter for Compound V3 (Comet) on Base | [contracts/src/strategies/CompoundV3Strategy.sol](contracts/src/strategies/CompoundV3Strategy.sol) |
| `MoonwellStrategy` | Strategy adapter for Moonwell on Base | [contracts/src/strategies/MoonwellStrategy.sol](contracts/src/strategies/MoonwellStrategy.sol) |
| `MorphoStrategy` | Strategy adapter for MetaMorpho vaults on Base | [contracts/src/strategies/MorphoStrategy.sol](contracts/src/strategies/MorphoStrategy.sol) |

---

## Tech Stack

- **Blockchain**: Base (Ethereum L2, Chain ID 8453)
- **Smart Contracts**: Solidity 0.8.24, Foundry, OpenZeppelin v5
- **Oracle/Automation**: Chainlink CRE (Runtime Environment)
- **AI**: Claude API (Anthropic)
- **Frontend**: Next.js 15, wagmi v2, Privy (email + wallet auth), Tailwind CSS
- **Protocols Analyzed**: Aave V3, Compound V3, Moonwell, Morpho

---

## Project Structure

```
Kairos-Finance/
  contracts/           Foundry smart contracts
    src/vault/         ERC-4626 vault
    src/controller/    CRE consumer
    src/strategies/    Protocol adapters (4)
    src/interfaces/    External protocol interfaces
    src/libraries/     DataTypes, ProtocolRegistry
    test/              Unit tests (17 passing)
  cre-workflow/        Chainlink CRE TypeScript workflow
    src/handler.ts     Core orchestration logic
    src/protocols/     APY readers (Aave, Compound, Moonwell, Morpho)
    src/ai/            Claude API integration + prompts
  frontend/            Next.js web application
    app/               Pages (landing, deposit/dashboard)
    hooks/             Wallet hooks (useActiveWallet)
    components/        LoginButton, LoginCard
    lib/               wagmi config, contract ABIs
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- Bun (`curl -fsSL https://bun.sh/install | bash`)

### Smart Contracts

```bash
cd contracts
forge install
forge build
forge test -vv
```

### CRE Workflow

```bash
cd cre-workflow
bun install
bun run build
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Fill in your Privy App ID and contract addresses
npm run dev
```

---

## Testing

Smart contracts: 17 tests passing

```
forge test -vv

[PASS] test_cancelTimedOutRequest()
[PASS] test_cancelTimedOutRequest_revertIfNotTimedOut()
[PASS] test_deposit()
[PASS] test_depositMultipleUsers()
[PASS] test_executeStrategy()
[PASS] test_executeStrategy_revertIfNotController()
[PASS] test_onReport_revertIfInvalidAllocation()
[PASS] test_onReport_revertIfNotForwarder()
[PASS] test_onReport_revertIfStrategyNotRegistered()
[PASS] test_requestStrategy()
[PASS] test_requestStrategy_revertIfActiveRequest()
[PASS] test_requestStrategy_revertIfControllerNotSet()
[PASS] test_requestStrategy_revertIfInvalidTimeHorizon()
[PASS] test_requestStrategy_revertIfNoDeposit()
[PASS] test_setController_revertIfNotOwner()
[PASS] test_setController_revertIfZeroAddress()
[PASS] test_withdraw()

Suite result: ok. 17 passed; 0 failed; 0 skipped
```

---

## Security Considerations

- ERC-4626 vault includes inflation attack prevention via `_decimalsOffset()`
- One active strategy request per user (prevents spam)
- Request timeout mechanism (24 hours) for stuck requests
- Controller only accepts reports from authorized Chainlink Forwarder
- Strategy adapters restrict access to vault and owner only
- All external calls use SafeERC20 for safe token transfers

---

## License

MIT
