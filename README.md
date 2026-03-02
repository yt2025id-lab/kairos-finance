# Kairos Finance

> **AI-Powered Yield Optimization on Base, Orchestrated by Chainlink CRE**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-orange.svg)](https://soliditylang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg)](https://nextjs.org/)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE-375BD2.svg)](https://docs.chain.link/cre)

---

## 1. Project Overview

**Kairos Finance** is a DeFi yield optimization protocol built on Base. Users deposit USDC, set a time horizon, and a Chainlink CRE workflow automatically queries four lending protocols in real time, consults Claude AI for analysis, and executes the best risk-adjusted strategy on-chain — without manual intervention.

> *Kairos* (Greek: the right moment) — because timing is everything in yield optimization.

### Problem

The Base lending landscape is fragmented. Aave, Compound, Moonwell, and Morpho all offer different APY rates that fluctuate constantly. Choosing the right protocol requires understanding rate mechanics, protocol risk, TVL depth, and time-horizon dynamics. Most users either park funds in one protocol indefinitely or spend hours manually comparing rates.

### Solution

Kairos Finance automates the full decision cycle. A Chainlink CRE workflow:

1. Reads live APY data directly from on-chain protocol contracts via `EVMClient`
2. Fetches additional off-chain data via `HTTPClient` (Morpho GraphQL API)
3. Sends all data to Claude AI with the user's time horizon and deposit size for analysis
4. Delivers the signed recommendation on-chain via `writeReport` for automatic execution

---

## Deployed Contracts — Base Sepolia (Chain ID: 84532)

> Last deployment: 2026-03-01

| Contract | Address | Explorer |
|----------|---------|---------|
| `KairosVault` | `0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855` | [View](https://sepolia.basescan.org/address/0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855) |
| `KairosController` | `0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF` | [View](https://sepolia.basescan.org/address/0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF) |
| `FaucetUSDC` (testnet token) | `0x4F6D082b3130745687dd200822280946125570F5` | [View](https://sepolia.basescan.org/address/0x4F6D082b3130745687dd200822280946125570F5) |
| `AaveV3Strategy` | `0xF130CE1Ee13f48FEEBc41a4d0dD0003900C56691` | [View](https://sepolia.basescan.org/address/0xF130CE1Ee13f48FEEBc41a4d0dD0003900C56691) |
| `CompoundV3Strategy` | `0x9A62F36d290C3A4280C4F7A8A6a51EAA1288cfD4` | [View](https://sepolia.basescan.org/address/0x9A62F36d290C3A4280C4F7A8A6a51EAA1288cfD4) |
| `MoonwellStrategy` | `0x19406467cC6E88Bd5F5bC932907c315AcC300Ccc` | [View](https://sepolia.basescan.org/address/0x19406467cC6E88Bd5F5bC932907c315AcC300Ccc) |
| `MorphoStrategy` | `0x32B6bA1a9Ff550C21027A0C0E39CC9CECd82B0b9` | [View](https://sepolia.basescan.org/address/0x32B6bA1a9Ff550C21027A0C0E39CC9CECd82B0b9) |

---

## 2. Key Features

| Feature | Description |
|---------|-------------|
| **AI-Powered Yield Analysis** | Claude AI analyzes live protocol data against user parameters to recommend the optimal strategy |
| **Chainlink CRE Orchestration** | Trustless, DON-executed workflow triggered by on-chain events — no centralized server |
| **Multi-Protocol Strategy** | Covers Aave V3, Compound V3, Moonwell, and Morpho on Base in every analysis |
| **ERC-4626 Vault** | Standard-compliant tokenized vault — users receive `kYLD` shares representing their position |
| **Automated Execution** | From deposit to strategy allocation, execution is fully on-chain and verifiable |
| **Request Timeout Safety** | Stuck requests auto-expire after 24 hours, preventing locked funds |

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER (Web Frontend)                      │
│        Deposits USDC → KairosVault (ERC-4626)                   │
│        Calls requestStrategy(timeHorizon)                       │
└───────────────────────────┬─────────────────────────────────────┘
                            │  StrategyRequested event emitted
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CHAINLINK CRE RUNTIME (DON)                    │
│                                                                 │
│  EVM Log Trigger ──► Workflow Execution                         │
│                            │                                    │
│         ┌──────────────────┼──────────────────────┐            │
│         │                  │                       │            │
│  EVMClient reads    EVMClient reads        EVMClient reads      │
│  Aave V3            Compound V3            Moonwell              │
│  getReserveData()   getSupplyRate()        supplyRatePerTs()     │
│         │                  │                       │            │
│         └──────────────────┼──────────────────────┘            │
│                            │                                    │
│                   HTTPClient → Morpho GraphQL API               │
│                            │                                    │
│                   HTTPClient → Claude AI API                    │
│                   (ANTHROPIC_API_KEY via CRE Secrets)           │
│                            │                                    │
│               Claude returns structured JSON                    │
│               { protocolId, allocationBps, expectedAPY }        │
│                            │                                    │
│                  writeReport → KairosController                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │  onReport() called
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ON-CHAIN EXECUTION                           │
│                                                                 │
│  KairosController decodes report                                │
│        │                                                        │
│        └──► Strategy Adapter (Aave / Compound / Moonwell / Morpho)
│                    │                                            │
│                    └──► Funds deposited into chosen protocol    │
└─────────────────────────────────────────────────────────────────┘
```

### CRE Runtime Role

The Chainlink CRE (Runtime Environment) replaces a traditional backend server with a decentralized DON that:
- Watches for on-chain events via `EVMClient.logTrigger`
- Executes off-chain API calls via `HTTPClient` with BFT consensus
- Delivers signed results on-chain via `writeReport`
- Runs periodic rebalance checks via `CronCapability`

---

## 4. Tech Stack

### Smart Contracts

| Component | Technology |
|-----------|-----------|
| Language | Solidity 0.8.24 |
| Framework | Foundry |
| Vault Standard | ERC-4626 (OpenZeppelin v5) |
| Token Safety | SafeERC20 |

### CRE Workflow

| Component | Technology |
|-----------|-----------|
| Runtime | Chainlink CRE (`@chainlink/cre-sdk`) |
| Language | TypeScript (ESM) |
| AI Model | Claude Sonnet (`claude-sonnet-4-6`) |
| Validation | Zod schema validation |
| EVM Utilities | viem v2 |

### Frontend

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| Web3 | wagmi v2 + viem v2 |
| Authentication | Privy v3 (email + embedded wallet) |
| Data Fetching | TanStack Query v5 |
| Styling | Tailwind CSS v4 |

### Network

| Network | Chain ID | Purpose |
|---------|----------|---------|
| Base Mainnet | 8453 | Production |
| Base Sepolia | 84532 | Testnet / Development |

---

## 5. Project Structure

```
kairos-finance/
├── contracts/                  Foundry smart contracts
│   ├── src/
│   │   ├── vault/              KairosVault.sol — ERC-4626 deposit vault
│   │   ├── controller/         KairosController.sol — CRE IReceiver consumer
│   │   ├── strategies/         Protocol adapters (Aave, Compound, Moonwell, Morpho)
│   │   ├── interfaces/         External protocol interfaces
│   │   └── libraries/          DataTypes.sol, ProtocolRegistry.sol
│   ├── script/
│   │   ├── DeployTestnet.s.sol Deploys to Base Sepolia
│   │   ├── Deploy.s.sol        Deploys to Base Mainnet
│   │   └── DemoE2E.s.sol       End-to-end demonstration script
│   └── test/                   17 unit tests (100% passing)
│
├── cre-workflow/               Chainlink CRE TypeScript workflow
│   ├── main.ts                 Workflow entry point and trigger registration
│   ├── workflow.yaml           CRE deployment targets (staging / production)
│   ├── config.json             Production config (Base Mainnet)
│   ├── config.staging.json     Staging config (Base Sepolia)
│   ├── secrets.yaml            CRE Secrets declaration (names only, no values)
│   └── src/
│       ├── handler.ts          Core orchestration logic
│       ├── protocols/          APY readers — aave.ts, compound.ts, moonwell.ts, morpho.ts
│       ├── ai/                 Claude integration — claude.ts, prompts.ts, types.ts
│       └── utils/              ABI encoding helpers
│
├── frontend/                   Next.js web application
│   ├── app/                    Pages — landing, deposit/dashboard
│   ├── components/             NetworkGuard, LoginButton, TransactionButton, etc.
│   ├── hooks/                  useDeposit, useWithdraw, useRequestStrategy, useVaultBalance
│   ├── lib/
│   │   ├── wagmi.ts            wagmi config with RPC fallback
│   │   └── contracts/          ABIs, addresses, contract helpers
│   └── .env.example            Environment variable template
│
└── docs/
    ├── README.md               Full technical documentation
    └── CHAINLINK_INTEGRATION.md Detailed Chainlink integration reference
```

---

## 6. Getting Started

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation) — `curl -L https://foundry.paradigm.xyz | bash`
- [Bun](https://bun.sh) (frontend) — `curl -fsSL https://bun.sh/install | bash`

---

### Smart Contracts

```bash
cd contracts

# Install dependencies
forge install

# Build
forge build

# Run tests
forge test -vv

# Deploy to Base Sepolia
cp .env.example .env
# Fill in PRIVATE_KEY and BASE_SEPOLIA_RPC_URL
forge script script/DeployTestnet.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast -vvvv
```

---

### CRE Workflow

```bash
cd cre-workflow

# Install dependencies
npm install

# Build TypeScript
npm run build

# Simulate locally (requires cre CLI)
npm run simulate

# Deploy to Chainlink DON (requires CRE credentials)
npm run deploy
```

> **Important**: The CRE workflow runs on the Chainlink DON. Set `ANTHROPIC_API_KEY` via CRE Secrets — never as a plain environment variable. See [docs/CHAINLINK_INTEGRATION.md](docs/CHAINLINK_INTEGRATION.md) for full setup instructions.

---

### Frontend

```bash
cd frontend

# Install dependencies
bun install

# Configure environment
cp .env.example .env.local
# Fill in required values — see Environment Variables section

# Start development server
bun run dev
```

---

## 7. Environment Variables

Copy `frontend/.env.example` to `frontend/.env.local` and configure the values below.

### Required

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_VAULT_ADDRESS` | Deployed `KairosVault` contract address |
| `NEXT_PUBLIC_CONTROLLER_ADDRESS` | Deployed `KairosController` contract address |
| `NEXT_PUBLIC_CHAIN_ID` | Target chain (`8453` = Base Mainnet, `84532` = Base Sepolia) |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy app ID — get one at [console.privy.io](https://console.privy.io) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_BASE_RPC` | Custom Base Mainnet RPC (Alchemy, Infura, QuickNode, etc.) | Public Base RPC |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | Custom Base Sepolia RPC | Public Sepolia RPC |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token address override | Base Mainnet USDC |
| `NEXT_PUBLIC_FAUCET_ADDRESS` | Testnet faucet address (Sepolia only) | — |

> **Never commit `.env.local` or any file containing real values.**

---

## 8. Security Considerations

| Concern | Mitigation |
|---------|-----------|
| **API Key Management** | `ANTHROPIC_API_KEY` is stored exclusively via CRE Secrets — never hardcoded in workflow code or committed to git |
| **Forwarder Authorization** | `KairosController.onReport()` only accepts calls from the registered Chainlink Forwarder address, preventing spoofed recommendations |
| **Strategy Validation** | `allocationBps` must be ≤ 10,000 and `protocolId` must reference a registered strategy; invalid reports revert |
| **AI Response Validation** | Claude's JSON response is validated against a Zod schema before any on-chain encoding is performed |
| **Inflation Attack Prevention** | `KairosVault` uses `_decimalsOffset()` to prevent ERC-4626 share inflation attacks |
| **Request Spam Prevention** | One active strategy request per user; duplicate calls revert |
| **Stuck Request Recovery** | Requests auto-expire after 24 hours, allowing re-requests without funds being locked |
| **Safe Token Transfers** | All ERC20 operations use OpenZeppelin `SafeERC20` throughout the strategy adapters |
| **Environment Files** | All secret-bearing files excluded from git via `.gitignore` |

---

## 9. Demo / E2E Script

A Forge script proves the complete flow on Base Sepolia in six automated steps:

```bash
cd contracts

# Requires .env with PRIVATE_KEY and BASE_SEPOLIA_RPC_URL
forge script script/DemoE2E.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast -vvvv
```

| Step | Action |
|------|--------|
| 1 | Claim testnet USDC from the faucet |
| 2 | Approve and deposit USDC into `KairosVault` |
| 3 | Call `requestStrategy(timeHorizon)` — emits `StrategyRequested` |
| 4 | Simulate CRE report delivery via `controller.onReport()` |
| 5 | Verify position is active and correctly allocated |
| 6 | Withdraw funds from the strategy |

**Script**: [`contracts/script/DemoE2E.s.sol`](contracts/script/DemoE2E.s.sol)

---

## 10. Private & Sensitive Files Policy

The following files must **never** be committed to version control:

| File | Reason |
|------|--------|
| `frontend/.env.local` | Contains contract addresses, Privy app ID, and RPC URLs |
| `contracts/.env` | Contains deployer private key and RPC endpoints |
| `cre-workflow/secrets.yaml` with values | Values are injected by CRE runtime — the file must declare names only |

### `.gitignore` Requirements

```gitignore
# Environment files
.env
.env.local
.env.*
!.env.example

# Build artifacts
node_modules/
dist/
build/
.next/
out/

# Test coverage
coverage/
```

### CRE Secrets

`ANTHROPIC_API_KEY` is managed entirely through Chainlink CRE Secrets. The `secrets.yaml` file declares the secret name only — no values — and is safe to commit:

```yaml
secrets:
  ANTHROPIC_API_KEY:
    description: "Anthropic API key for Claude AI yield analysis"
    env: ANTHROPIC_API_KEY
```

The actual key is uploaded via the CRE CLI or dashboard and is never stored in this repository.

---

## Smart Contract Tests

17/17 tests passing. Run with:

```bash
cd contracts && forge test -vv
```

```
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

## License

[MIT](LICENSE)
