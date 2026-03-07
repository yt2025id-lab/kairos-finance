# Kairos Finance

> **AI-Powered Yield Optimization on Base, Orchestrated by Chainlink CRE**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE%20SDK%20v1.1.1-375BD2?logo=chainlink&logoColor=white)](https://docs.chain.link)
[![Built on Base](https://img.shields.io/badge/Built%20on-Base%20Sepolia-0052FF?logo=coinbase&logoColor=white)](https://base.org)
[![Tests](https://img.shields.io/badge/Forge%20Tests-17%2F17%20passing-brightgreen)](contracts/test/)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-kairosfinance.vercel.app-blue?logo=vercel)](https://kairosfinance.vercel.app)

**Hackathon:** Chainlink Convergence 2025 · **Tracks:** CRE & AI · DeFi & Tokenization

| | |
|--|--|
| **Live App** | [kairosfinance.vercel.app](https://kairosfinance.vercel.app) |
| **Demo Video** | _[Add YouTube link after recording]_ |
| **Network** | Base Sepolia (Chain ID: 84532) |

---

## The Problem

There are **4 major USDC lending protocols on Base** — Aave V3, Compound V3, Moonwell, and Morpho. Their rates change every block based on utilization. Most users either pick one and never move, or spend hours manually comparing APYs, TVL, and risk profiles.

**The result: capital is systematically misallocated across DeFi.**

No existing solution uses an AI agent with real-time on-chain data, decentralized consensus, and automatic execution — until now.

---

## The Solution

Kairos Finance uses a **Chainlink CRE workflow** to orchestrate an end-to-end AI yield optimization pipeline:

1. User deposits USDC into an ERC-4626 vault and selects a time horizon (1–12 months)
2. A `StrategyRequested` on-chain event triggers the **CRE EVM Log Trigger**
3. The CRE workflow reads **live APY data from 3 protocols** via `EVMClient` (on-chain) and **Morpho** via `HTTPClient` (off-chain GraphQL)
4. **Claude AI** scores all 4 protocols using a weighted framework (APY, Safety, TVL, Stability) — called via `HTTPClient` inside `runInNodeMode` with `consensusIdenticalAggregation`
5. The signed recommendation is delivered **on-chain via `writeReport`** with DON consensus
6. `KairosController` decodes the report and deploys funds to the winning protocol automatically

**Everything runs on Chainlink's DON — no centralized backend.**

---

## Chainlink CRE Integration

### Files Using Chainlink CRE SDK

> As required by hackathon submission guidelines, all Chainlink-integrated files are listed below.

| File | Chainlink Component | Description |
|------|-------------------|-------------|
| [`cre-workflow/main.ts`](cre-workflow/main.ts) | `Runner`, `EVMClient.logTrigger`, `CronCapability.trigger` | Workflow entry point, registers both triggers |
| [`cre-workflow/src/handler.ts`](cre-workflow/src/handler.ts) | `EVMClient`, `runtime.runInNodeMode`, `consensusIdenticalAggregation`, `prepareReportRequest`, `runtime.report`, `evmClient.writeReport`, `runtime.getSecret` | Core orchestration logic |
| [`cre-workflow/src/ai/claude.ts`](cre-workflow/src/ai/claude.ts) | `HTTPClient.sendRequest` (NodeRuntime) | Claude AI call inside `runInNodeMode` |
| [`cre-workflow/src/protocols/aave.ts`](cre-workflow/src/protocols/aave.ts) | `EVMClient.callContract` | On-chain Aave V3 APY read |
| [`cre-workflow/src/protocols/compound.ts`](cre-workflow/src/protocols/compound.ts) | `EVMClient.callContract` | On-chain Compound V3 APY read |
| [`cre-workflow/src/protocols/moonwell.ts`](cre-workflow/src/protocols/moonwell.ts) | `EVMClient.callContract` | On-chain Moonwell APY read |
| [`cre-workflow/src/protocols/morpho.ts`](cre-workflow/src/protocols/morpho.ts) | `HTTPClient.sendRequest` (NodeRuntime) | Off-chain Morpho GraphQL APY |
| [`cre-workflow/workflow.yaml`](cre-workflow/workflow.yaml) | CRE targets config | Staging + production workflow targets |
| [`cre-workflow/config.staging.json`](cre-workflow/config.staging.json) | CRE runtime config | Base Sepolia vault + controller addresses |
| [`contracts/src/controller/KairosController.sol`](contracts/src/controller/KairosController.sol) | `IReceiver.onReport` | On-chain CRE report receiver |

### 7 CRE Products Used

| # | Product | Where Used |
|---|---------|-----------|
| 1 | **CRE Workflow** (`@chainlink/cre-sdk`) | `main.ts` — `Runner.newRunner()` |
| 2 | **EVM Log Trigger** | `main.ts` — `evmClient.logTrigger()` on `StrategyRequested` event |
| 3 | **EVMClient** | `handler.ts`, `aave.ts`, `compound.ts`, `moonwell.ts` |
| 4 | **HTTPClient** | `claude.ts` (AI), `morpho.ts` (GraphQL) |
| 5 | **writeReport** | `handler.ts` — `evmClient.writeReport()` |
| 6 | **Cron Trigger** | `main.ts` — `CronCapability.trigger()` every 6 hours |
| 7 | **Secrets** | `handler.ts` — `runtime.getSecret({ id: "ANTHROPIC_API_KEY" })` |

### Core CRE Code Patterns

**EVM Log Trigger + EVMClient APY read:**
```typescript
// cre-workflow/main.ts
const evmClient = new cre.capabilities.EVMClient(BASE_CHAIN_SELECTOR);
handlers.push(cre.handler({
  trigger: evmClient.logTrigger({
    addresses: [config.vaultAddress],
    topics: [{ values: [STRATEGY_REQUESTED_TOPIC] }],
  }),
  handler: (runtime, log) => onStrategyRequested(runtime, log),
}));
```

**`runInNodeMode` with `consensusIdenticalAggregation` for AI call:**
```typescript
// cre-workflow/src/handler.ts
const apiKey = runtime.getSecret({ id: "ANTHROPIC_API_KEY" }).result();

const analysis = runtime.runInNodeMode(
  (nodeRuntime: NodeRuntime<Config>) =>
    analyzeAndRecommend(nodeRuntime, protocols, prompt, apiKey),
  consensusIdenticalAggregation<AIAnalysis>()
)().result();
```

**HTTPClient calling Claude AI (inside NodeRuntime):**
```typescript
// cre-workflow/src/ai/claude.ts
const httpClient = new cre.capabilities.HTTPClient();
const response = httpClient.sendRequest(nodeRuntime, {
  url: "https://api.anthropic.com/v1/messages",
  method: "POST",
  headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
  body: btoa(JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 2048, messages: [...] })),
}).result();
```

**Signed report delivery on-chain:**
```typescript
// cre-workflow/src/handler.ts
const reportRequest = prepareReportRequest(encodedPayload);
const report = runtime.report(reportRequest).result();
evmClient.writeReport(runtime, {
  receiver: runtime.config.controllerAddress,
  report,
  gasConfig: { gasLimit: "500000" },
}).result();
```

**On-chain receiver (`IReceiver` interface):**
```solidity
// contracts/src/controller/KairosController.sol
function onReport(bytes calldata metadata, bytes calldata report) external onlyForwarder {
    (address user, uint8 protocolId, uint256 allocationBps, uint256 expectedAPY, string memory reasoning)
        = abi.decode(report, (address, uint8, uint256, uint256, string));
    // ... execute strategy
}
```

---

## AI Scoring Engine

Claude AI evaluates every protocol on **4 weighted dimensions** — not just highest APY:

| Factor | Base Weight | Rationale |
|--------|-------------|-----------|
| APY | 35% | Primary yield driver |
| Safety | 30% | Protocol maturity, audits, battle-tested history |
| TVL Depth | 20% | Liquidity and market trust signal |
| Stability | 15% | Rate consistency over investment horizon |

**Dynamic weight adjustments based on user's time horizon:**
- `< 30 days` → Safety +10%, APY −10% (capital preservation priority)
- `> 90 days` → APY +10%, Safety −10% (compounding matters more)
- `deposit > $50K` → TVL +5% (liquidity depth critical for large positions)

**Output stored on-chain in `RecommendationReceived` event:**
- `confidence` — AI certainty score (0–100)
- `riskScore` — Overall risk assessment (0–100, higher = safer)
- `scores[]` — Per-protocol weighted breakdown (APY, Safety, TVL, Stability)
- `alternatives[]` — Ranked alternatives with reasoning for why not chosen

---

## Smart Contracts

**Network:** Base Sepolia (Chain ID: 84532) · **7 deployed · 17/17 tests passing**

| Contract | Address | Explorer |
|----------|---------|----------|
| FaucetUSDC | `0xAb8a67C042a60FBD01ca769799941cF694ff57C9` | [Basescan ↗](https://sepolia.basescan.org/address/0xAb8a67C042a60FBD01ca769799941cF694ff57C9) |
| KairosVault (ERC-4626) | `0x884d48fcBff76A48Eb52A97cE836B36AfBbDF43F` | [Basescan ↗](https://sepolia.basescan.org/address/0x884d48fcBff76A48Eb52A97cE836B36AfBbDF43F) |
| KairosController | `0xB2d0Fe7d2Eb85b2A2d0eD3a5cEA6A61b5F69DBcB` | [Basescan ↗](https://sepolia.basescan.org/address/0xB2d0Fe7d2Eb85b2A2d0eD3a5cEA6A61b5F69DBcB) |
| AaveV3Strategy | `0xeC6e6ABe3DF9B3bD471d66Bd759c63a5f8e58dEF` | [Basescan ↗](https://sepolia.basescan.org/address/0xeC6e6ABe3DF9B3bD471d66Bd759c63a5f8e58dEF) |
| CompoundV3Strategy | `0xB94980938429bc6eE6b6E0fD4AB836652119B981` | [Basescan ↗](https://sepolia.basescan.org/address/0xB94980938429bc6eE6b6E0fD4AB836652119B981) |
| MoonwellStrategy | `0x76bF3c419BDAf509bD6c15d8Fbf26EDA96b676ce` | [Basescan ↗](https://sepolia.basescan.org/address/0x76bF3c419BDAf509bD6c15d8Fbf26EDA96b676ce) |
| MorphoStrategy | `0x045Ef6487EAf645B80781ac8c1504566FF419Cf0` | [Basescan ↗](https://sepolia.basescan.org/address/0x045Ef6487EAf645B80781ac8c1504566FF419Cf0) |

### Contract Architecture

```
KairosVault (ERC-4626)
  └── requestStrategy(timeHorizon) ──► emits StrategyRequested
                                              │
                                    CRE EVM Log Trigger
                                              │
                                    CRE Workflow runs...
                                              │
                                    writeReport on-chain
                                              │
KairosController (IReceiver)  ◄──────────────┘
  └── onReport(metadata, report)
      ├── decode (address, uint8, uint256, uint256, string)
      ├── emit RecommendationReceived(user, protocol, apy, reasoning)
      ├── call vault.executeStrategy(user, strategy, amount)
      │
      └── Strategy Adapters:
          ├── AaveV3Strategy.deposit(user, amount)
          ├── CompoundV3Strategy.deposit(user, amount)
          ├── MoonwellStrategy.deposit(user, amount)
          └── MorphoStrategy.deposit(user, amount)
```

### Security
- ERC-4626 inflation attack prevention via `_decimalsOffset(6)`
- One active request per user — prevents double-execution
- 24-hour timeout via `cancelTimedOutRequest()`
- `onlyForwarder` modifier — only Chainlink Forwarder can call `onReport`
- `SafeERC20` on all token transfers
- AI recommendation validated on-chain before execution

---

## Repository Structure

```
kairos-finance/
├── cre-workflow/                    # Chainlink CRE SDK workflow
│   ├── main.ts                      # Runner, EVM Log Trigger, Cron Trigger
│   ├── workflow.yaml                # CRE targets (staging + production)
│   ├── config.staging.json          # Base Sepolia runtime config
│   ├── config.json                  # Base mainnet config
│   └── src/
│       ├── handler.ts               # onStrategyRequested, onRebalanceCheck
│       ├── ai/
│       │   ├── claude.ts            # Claude AI via CRE HTTPClient
│       │   ├── prompts.ts           # Weighted scoring prompt engine
│       │   └── types.ts             # AIAnalysis, ProtocolScore, etc.
│       ├── protocols/
│       │   ├── aave.ts              # Aave V3 APY via EVMClient
│       │   ├── compound.ts          # Compound V3 APY via EVMClient
│       │   ├── moonwell.ts          # Moonwell APY via EVMClient
│       │   └── morpho.ts            # Morpho APY via HTTPClient (GraphQL)
│       └── utils/encoding.ts
│
├── contracts/                       # Solidity — Foundry
│   ├── src/
│   │   ├── vault/KairosVault.sol    # ERC-4626 vault + requestStrategy
│   │   ├── controller/
│   │   │   └── KairosController.sol # IReceiver — CRE report handler
│   │   └── strategies/              # Protocol adapters (4 contracts)
│   ├── test/                        # 17 Forge unit tests
│   └── script/DemoE2E.s.sol         # 6-step E2E on-chain demo
│
└── frontend/                        # Next.js 16
    ├── app/deposit/page.tsx          # Live APY + AI Analysis + History
    ├── components/LoginButton.tsx    # Privy auth
    ├── hooks/useActiveWallet.ts
    └── lib/
        ├── contracts.ts             # ABIs + deployed addresses
        └── wagmi.ts                 # wagmi config (Base Sepolia + Base)
```

---

## Quick Start

### Prerequisites
- [Foundry](https://getfoundry.sh/)
- Node.js 18+
- Base Sepolia ETH → [QuickNode faucet](https://faucet.quicknode.com/base/sepolia)

### Smart Contracts

```bash
cd contracts
forge build
forge test -vv
# Expected: 17/17 tests pass
```

### CRE Workflow

```bash
cd cre-workflow
npm install
npm run build
# Requires @chainlink/cre-sdk — see workflow.yaml for CRE targets
```

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local
npm run dev
# Open http://localhost:3000/deposit
```

### End-to-End Demo (Base Sepolia)

```bash
cd contracts
export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
forge script script/DemoE2E.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast -vvvv
# Executes: faucet → deposit → requestStrategy → onReport → verify → withdraw
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Blockchain | Base L2 (Ethereum) |
| Smart Contracts | Solidity 0.8.24, Foundry, OpenZeppelin v5 |
| CRE Orchestration | `@chainlink/cre-sdk` v1.1.1 |
| AI Engine | Claude Sonnet 4.6 (Anthropic) |
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Auth | Privy (email · wallet · Google OAuth) |
| Web3 | wagmi v2, viem v2 |

---

## License

MIT

---

*Chainlink Convergence 2025 Hackathon · CRE & AI Track · DeFi & Tokenization Track*
