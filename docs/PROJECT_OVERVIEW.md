# Kairos Finance - Project Overview

> *Kairos* (Greek: καιρός) — "the right moment." In DeFi, timing matters.

## What is Kairos Finance?

Kairos Finance is an AI-powered yield optimization protocol on **Base** blockchain. Users deposit USDC, choose a time horizon, and the system automatically finds the best lending rate across four DeFi protocols using **Claude AI**, all orchestrated by **Chainlink CRE**.

**Live Demo**: [kairosfinance.vercel.app](https://kairosfinance.vercel.app)
**Source Code**: [github.com/yt2025id-lab/kairos-finance](https://github.com/yt2025id-lab/kairos-finance)

---

## The Problem

DeFi users on Base face a fragmented lending landscape:

- **4+ lending protocols** (Aave V3, Compound V3, Moonwell, Morpho) each with different APY rates
- Rates **fluctuate constantly** based on utilization, incentives, and market conditions
- Choosing the right protocol requires understanding rate mechanics, protocol risk, TVL depth, and time horizon
- Most users **pick one and stick with it**, leaving yield on the table

## The Solution

Kairos Finance automates the entire decision process:

1. **Deposit** USDC into an ERC-4626 vault
2. **Choose** your target timeline (1, 3, 6, or 12 months)
3. **AI analyzes** live APY data from all 4 protocols
4. **Funds are deployed** to the recommended protocol automatically

No manual rate comparison. No protocol hopping. One transaction.

---

## How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                        USER                                  │
│  1. Deposit USDC  →  2. Choose timeline  →  3. Request AI    │
└────────────┬─────────────────────────────────────┬───────────┘
             │                                     │
             ▼                                     ▼
┌────────────────────────┐          ┌──────────────────────────┐
│    KairosVault         │          │   StrategyRequested      │
│    (ERC-4626)          │          │   Event emitted          │
│    Holds user funds    │          └────────────┬─────────────┘
└────────────────────────┘                       │
                                                 ▼
                              ┌──────────────────────────────────────┐
                              │     Chainlink CRE Workflow           │
                              │                                      │
                              │  ┌─ EVMClient → Aave V3 APY         │
                              │  ├─ EVMClient → Compound V3 APY     │
                              │  ├─ EVMClient → Moonwell APY        │
                              │  ├─ HTTPClient → Morpho GraphQL     │
                              │  │                                   │
                              │  └─► HTTPClient → Claude AI API     │
                              │       "Analyze these rates for a     │
                              │        6-month time horizon..."      │
                              │                                      │
                              │  Result: { protocol: "Aave",         │
                              │            apy: 5.2%,                │
                              │            reasoning: "..." }        │
                              └────────────────┬─────────────────────┘
                                               │
                                               ▼ writeReport()
                              ┌──────────────────────────────────────┐
                              │    KairosController                  │
                              │    Decodes recommendation            │
                              │    Executes via Strategy Adapter     │
                              └────────────────┬─────────────────────┘
                                               │
                          ┌────────┬───────────┼───────────┬────────┐
                          ▼        ▼           ▼           ▼        │
                       Aave V3  Compound V3  Moonwell   Morpho     │
                       Strategy Strategy     Strategy   Strategy   │
                          │        │           │           │        │
                          └────────┴───────────┴───────────┘        │
                                   User earns yield                 │
                                   Can withdraw anytime ◄───────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Blockchain** | Base (Ethereum L2) |
| **Smart Contracts** | Solidity 0.8.24, Foundry, OpenZeppelin v5 |
| **Orchestration** | Chainlink CRE (Runtime Environment) |
| **AI Engine** | Claude API (Anthropic) |
| **Frontend** | Next.js 15, React 19, Tailwind CSS |
| **Wallet Auth** | Privy (email + wallet + Google) |
| **Web3 SDK** | wagmi v2, viem v2 |
| **DeFi Protocols** | Aave V3, Compound V3, Moonwell, Morpho |

---

## Project Structure

```
Kairos-Finance/
│
├── contracts/                        # Solidity smart contracts (Foundry)
│   ├── src/
│   │   ├── vault/KairosVault.sol            # ERC-4626 vault — user deposits
│   │   ├── controller/KairosController.sol  # CRE consumer — receives AI reports
│   │   ├── strategies/
│   │   │   ├── IStrategy.sol                # Common interface for all adapters
│   │   │   ├── AaveV3Strategy.sol           # Aave V3 deposit/withdraw
│   │   │   ├── CompoundV3Strategy.sol       # Compound V3 (Comet)
│   │   │   ├── MoonwellStrategy.sol         # Moonwell mToken
│   │   │   └── MorphoStrategy.sol           # MetaMorpho vault (ERC-4626)
│   │   ├── interfaces/                      # External protocol ABIs
│   │   ├── libraries/
│   │   │   ├── DataTypes.sol                # Structs, enums, constants
│   │   │   └── ProtocolRegistry.sol         # Protocol address registry
│   │   └── mocks/
│   │       └── FaucetUSDC.sol               # Testnet faucet (100 USDC/hr)
│   ├── test/                                # 17 unit tests
│   └── script/
│       ├── Deploy.s.sol                     # Mainnet deployment
│       └── DeployTestnet.s.sol              # Testnet deployment
│
├── cre-workflow/                     # Chainlink CRE workflow (TypeScript)
│   ├── main.ts                              # Entry point + trigger registration
│   ├── src/
│   │   ├── handler.ts                       # Core orchestration logic
│   │   ├── protocols/
│   │   │   ├── index.ts                     # Aggregates all protocol reads
│   │   │   ├── aave.ts                      # On-chain: getReserveData()
│   │   │   ├── compound.ts                  # On-chain: getSupplyRate()
│   │   │   ├── moonwell.ts                  # On-chain: supplyRatePerTimestamp()
│   │   │   └── morpho.ts                    # Off-chain: GraphQL API
│   │   ├── ai/
│   │   │   ├── claude.ts                    # Claude API integration
│   │   │   ├── prompts.ts                   # Yield analysis prompt template
│   │   │   └── types.ts                     # TypeScript type definitions
│   │   ├── contracts/abi/                   # Contract ABI definitions
│   │   └── utils/encoding.ts               # Event decoding + report encoding
│   └── secrets.yaml                         # CRE Secrets (ANTHROPIC_API_KEY)
│
├── frontend/                         # Next.js web application
│   ├── app/
│   │   ├── page.tsx                         # Landing page
│   │   ├── deposit/page.tsx                 # Main app (deposit, strategy, withdraw)
│   │   ├── dashboard/page.tsx               # Redirect → /deposit
│   │   ├── providers.tsx                    # Privy + wagmi + React Query
│   │   └── layout.tsx                       # Root layout (dark theme)
│   ├── components/
│   │   └── LoginButton.tsx                  # Privy auth button + login card
│   ├── hooks/
│   │   └── useActiveWallet.ts               # Active wallet hook
│   └── lib/                                 # wagmi config, contract ABIs
│
└── docs/
    ├── README.md                            # Full documentation
    ├── CHAINLINK_INTEGRATION.md             # Detailed Chainlink usage (6 products)
    └── PROJECT_OVERVIEW.md                  # This file
```

---

## Smart Contracts

### Core Contracts

| Contract | Purpose |
|----------|---------|
| **KairosVault** | ERC-4626 vault for USDC deposits. Emits `StrategyRequested` events to trigger CRE workflow. Tracks user positions (amount, time horizon, active strategy). Minimum deposit: 10 USDC. |
| **KairosController** | Implements Chainlink `IReceiver` interface. Receives AI recommendations from CRE Forwarder, decodes them, and executes the recommended strategy via the vault. |
| **KairosFactory** | Deploys linked vault + controller pairs. |

### Strategy Adapters

| Adapter | Protocol | On-Chain Interaction |
|---------|----------|---------------------|
| **AaveV3Strategy** | Aave V3 | `Pool.supply()` / `Pool.withdraw()` |
| **CompoundV3Strategy** | Compound V3 | `Comet.supply()` / `Comet.withdraw()` |
| **MoonwellStrategy** | Moonwell | `mToken.mint()` / `mToken.redeem()` |
| **MorphoStrategy** | MetaMorpho | `vault.deposit()` / `vault.withdraw()` (ERC-4626) |

All adapters share the `IStrategy` interface: `deposit()`, `withdraw()`, `getBalance()`, `getAPY()`, `protocolName()`.

### Security

- Inflation attack prevention via `_decimalsOffset(6)` on the ERC-4626 vault
- One active strategy request per user (prevents spam)
- 24-hour timeout mechanism for stuck requests
- Only Chainlink Forwarder can deliver recommendations
- Strategy adapters restricted to vault & owner access
- All token transfers use `SafeERC20`

---

## Chainlink Integration (6 Products)

This is the core differentiator. Kairos Finance deeply integrates six Chainlink products:

| # | Product | What It Does |
|---|---------|--------------|
| 1 | **CRE Workflow** | Core orchestration — connects on-chain events to AI to execution |
| 2 | **CRE EVM Log Trigger** | Monitors `StrategyRequested` events from the vault |
| 3 | **CRE EVMClient** | Reads live APY from Aave, Compound, Moonwell on-chain |
| 4 | **CRE HTTPClient** | Calls Morpho GraphQL API + Claude AI API |
| 5 | **CRE writeReport** | Delivers AI recommendation on-chain to KairosController |
| 6 | **CRE Cron Trigger** | Auto-rebalancing check every 6 hours |
| 7 | **CRE Secrets** | Securely stores ANTHROPIC_API_KEY |

For detailed file-level references, see [CHAINLINK_INTEGRATION.md](CHAINLINK_INTEGRATION.md).

---

## AI Analysis

The CRE workflow calls Claude AI with structured data:

**Input to AI:**
- Live APY from 4 protocols (on-chain + off-chain reads)
- User's deposit amount
- User's time horizon (1-12 months)
- Protocol metadata (TVL, maturity, risk profile)

**AI Output (JSON):**
```json
{
  "protocolId": 0,
  "allocationBps": 10000,
  "expectedAPY": 520,
  "confidence": 85,
  "reasoning": "Aave V3 offers the highest risk-adjusted return for a 6-month horizon..."
}
```

The AI considers: current rates, rate stability, protocol risk, TVL depth, time horizon alignment, and historical patterns.

---

## Deployed Contracts (Base Sepolia Testnet)

| Contract | Address |
|----------|---------|
| **FaucetUSDC** | `0xAb8a67C042a60FBD01ca769799941cF694ff57C9` |
| **KairosVault** | `0x884d48fcBff76A48Eb52A97cE836B36AfBbDF43F` |
| **KairosController** | `0xB2d0Fe7d2Eb85b2A2d0eD3a5cEA6A61b5F69DBcB` |
| **AaveV3Strategy** | `0xeC6e6ABe3DF9B3bD471d66Bd759c63a5f8e58dEF` |
| **CompoundV3Strategy** | `0xB94980938429bc6eE6b6E0fD4AB836652119B981` |
| **MoonwellStrategy** | `0x76bF3c419BDAf509bD6c15d8Fbf26EDA96b676ce` |
| **MorphoStrategy** | `0x045Ef6487EAf645B80781ac8c1504566FF419Cf0` |

Judges can call `FaucetUSDC.faucet()` to claim 100 test USDC (1-hour cooldown per wallet).

---

## Frontend

### Pages

1. **Landing Page** (`/`) — Hero section, "How it works" steps, protocol showcase, tech stack badges
2. **Deposit Page** (`/deposit`) — Main app interface:
   - Claim testnet USDC from faucet
   - View wallet & vault balances
   - Deposit USDC (approve + deposit flow)
   - Choose target timeline (1, 3, 6, or 12 months)
   - Request AI analysis
   - View active position (protocol, APY, days remaining)
   - Withdraw from strategy

### Auth

Privy provides three login methods:
- Email (magic link)
- Wallet (MetaMask, Coinbase Wallet, etc.)
- Google OAuth

Privy automatically creates embedded wallets for users who sign in with email/Google.

---

## Testing

### Smart Contracts — 17/17 passing

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

## Quick Start

```bash
# 1. Clone
git clone https://github.com/yt2025id-lab/kairos-finance.git
cd kairos-finance

# 2. Smart Contracts
cd contracts
forge install
forge build
forge test -vv

# 3. CRE Workflow
cd ../cre-workflow
bun install
bun run build

# 4. Frontend
cd ../frontend
npm install
cp .env.local.example .env.local   # Fill in Privy App ID + contract addresses
npm run dev                         # → http://localhost:3000
```

---

## Hackathon Submission

- **Chainlink Convergence** — Tracks: "CRE & AI" + "DeFi & Tokenization"
- **Base Batches** — Accelerator program

---

## License

MIT
