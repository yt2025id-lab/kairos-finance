# Kairos Finance — Pitch Deck

> Copy each slide ke Google Slides / Canva. Satu section = satu slide.

---

## SLIDE 1 — Title

**KAIROS FINANCE**

*AI-Powered Yield Optimization on Base*
*Orchestrated by Chainlink CRE*

Chainlink Convergence Hackathon 2025
CRE & AI Track | DeFi & Tokenization Track

Live Demo: kairosfinance.vercel.app
GitHub: github.com/yt2025id-lab/kairos-finance

> Speaker notes: "Kairos is Greek for 'the right moment' — we find the right moment to optimize your yield."

---

## SLIDE 2 — The Problem

### DeFi Yield is Fragmented

- **4+ lending protocols** on Base — Aave, Compound, Moonwell, Morpho
- Rates change **every block** based on utilization & market conditions
- Users pick one protocol and **miss better yields elsewhere**
- Manual comparison requires understanding risk, TVL, rate stability
- Result: **Most users leave money on the table**

> Illustrasi: 4 kotak protocol dengan APY berbeda-beda (Aave 4.2%, Compound 3.8%, Moonwell 5.1%, Morpho 4.5%) — user bingung milih yang mana.

> Speaker notes: "Right now on Base, there are 4 major lending protocols for USDC. Each offers different rates that change constantly. Users either spend hours comparing, or just pick one and hope for the best. That's money left on the table."

---

## SLIDE 3 — The Solution

### 3 Steps. One Transaction. Best Yield.

```
1. DEPOSIT    →  Deposit USDC into Kairos Vault
2. CHOOSE     →  Select your investment timeline (1-12 months)
3. OPTIMIZE   →  AI analyzes 4 protocols and auto-deploys to the best one
```

**What happens behind the scenes:**
- Chainlink CRE reads live APY from 4 protocols on-chain
- Claude AI evaluates rates, risk, TVL, and your timeline
- Weighted scoring ranks every protocol (not just highest APY)
- Funds automatically deployed to the winner

**Result:** Best risk-adjusted return for YOUR specific timeline. Withdraw anytime.

> Speaker notes: "Kairos Finance makes it dead simple. Deposit, choose how long you want to invest, and our AI — orchestrated entirely by Chainlink CRE — finds and deploys to the best protocol. No manual research, no guessing."

---

## SLIDE 4 — Architecture

### How It Works

```
┌──────────────────────────────────────────────────────────────┐
│                     USER ACTION                              │
│              Deposit USDC + Request Strategy                 │
└──────────────┬───────────────────────────────────────────────┘
               │ StrategyRequested event
               ▼
┌──────────────────────────────────────────────────────────────┐
│              CHAINLINK CRE WORKFLOW                           │
│                                                              │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────┐   │
│  │  EVMClient   │  │  HTTPClient  │  │  CRE Secrets      │   │
│  │  Read APY:   │  │  Morpho API  │  │  ANTHROPIC_API_KEY │   │
│  │  • Aave V3   │  │  Claude AI   │  │                   │   │
│  │  • Compound  │  │              │  │                   │   │
│  │  • Moonwell  │  │              │  │                   │   │
│  └─────────────┘  └──────────────┘  └───────────────────┘   │
│                                                              │
│  AI Weighted Scoring: APY(35%) + Safety(30%) + TVL(20%)     │
│                       + Stability(15%)                       │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐   │
│  │  DON Consensus → Signed Report → writeReport on-chain │   │
│  └───────────────────────────────────────────────────────┘   │
└──────────────┬───────────────────────────────────────────────┘
               │ On-chain report
               ▼
┌──────────────────────────────────────────────────────────────┐
│              KAIROSCONTROLLER                                 │
│  Decode recommendation → Execute via Strategy Adapter        │
│  → USDC deployed to winning protocol → User earns yield      │
└──────────────────────────────────────────────────────────────┘
```

> Speaker notes: "Here's the full flow. When a user requests optimization, a StrategyRequested event fires on-chain. Chainlink CRE picks it up, reads live APY data from all 4 protocols using EVMClient, fetches Morpho data and calls Claude AI via HTTPClient, then delivers a signed recommendation back on-chain. The controller decodes it and automatically deploys funds. The entire pipeline runs on Chainlink's decentralized oracle network."

---

## SLIDE 5 — Chainlink CRE Integration

### 6 Chainlink Products. One Workflow.

| # | CRE Product | How We Use It |
|---|-------------|---------------|
| 1 | **CRE Workflow** | Core orchestration — connects events to AI to execution |
| 2 | **EVM Log Trigger** | Monitors `StrategyRequested` events from vault |
| 3 | **EVMClient** | Reads live APY from Aave, Compound, Moonwell on-chain |
| 4 | **HTTPClient** | Calls Morpho GraphQL API + Claude AI API |
| 5 | **writeReport** | Delivers signed AI recommendation on-chain |
| 6 | **Cron Trigger** | Automatic rebalancing check every 6 hours |
| 7 | **Secrets** | Secure storage for ANTHROPIC_API_KEY |

> **Most hackathon projects use 1-2 Chainlink services.**
> **Kairos Finance uses 7 across the entire CRE stack.**

Every step runs on Chainlink's Decentralized Oracle Network with **Byzantine Fault Tolerant consensus** — not a centralized server.

> Speaker notes: "This is where Kairos shines. We don't just use one CRE feature — we use SEVEN across the entire stack. From event monitoring to on-chain reads to off-chain AI calls to report delivery. Most projects use one or two Chainlink services. We use seven, all in a single cohesive workflow. And everything runs with BFT consensus on the DON — not on our servers."

---

## SLIDE 6 — AI Analysis Engine

### Not Just Highest APY. Weighted Intelligence.

**Scoring Framework:**

| Factor | Weight | What It Measures |
|--------|--------|-----------------|
| APY | 35% | Current yield relative to peers |
| Safety | 30% | Protocol maturity, audits, track record |
| TVL Depth | 20% | Liquidity and trust indicator |
| Stability | 15% | Rate consistency over time |

**Dynamic Adjustments:**
- Short horizon (<30 days): Safety +10%, APY -10%
- Long horizon (>90 days): APY +10%, Safety -10%
- Large deposits (>$50K): TVL +5%

**Output:**
- Confidence score (0-100)
- Risk assessment (0-100, higher = safer)
- Per-protocol weighted scores
- Top recommendation + ranked alternatives with reasoning

> Tampilkan screenshot AI Analysis card dari frontend (score bars, confidence, alternatives)

> Speaker notes: "Our AI doesn't just pick the highest APY. It uses a weighted scoring framework across four dimensions. And these weights adjust dynamically based on your timeline — short-term investors get more weight on safety, long-term gets more weight on APY. The result is a confidence score, risk assessment, per-protocol breakdown, and ranked alternatives with explanations for why each wasn't chosen."

---

## SLIDE 7 — Smart Contract Architecture

### 7 Contracts. 17 Tests. Production-Ready.

```
KairosVault (ERC-4626)          ← User deposits USDC here
    │
    ├── StrategyRequested event  → Triggers CRE Workflow
    │
KairosController (IReceiver)    ← Receives CRE report
    │
    ├── AaveV3Strategy           → Deposits to Aave V3
    ├── CompoundV3Strategy       → Deposits to Compound V3
    ├── MoonwellStrategy         → Deposits to Moonwell
    └── MorphoStrategy           → Deposits to Morpho

FaucetUSDC                      → Testnet: 100 USDC/hr
```

**Security Features:**
- ERC-4626 with inflation attack prevention (`_decimalsOffset(6)`)
- One active request per user (spam prevention)
- 24-hour timeout for stuck requests
- Only Chainlink Forwarder can deliver reports
- SafeERC20 for all token transfers
- 17/17 unit tests passing

> Speaker notes: "Our contract architecture uses the ERC-4626 vault standard with a Strategy Adapter pattern. When the CRE delivers a recommendation, the controller decodes it and routes funds to the winning protocol adapter. We've built in multiple security layers — inflation attack prevention, one-request-per-user limits, timeout mechanisms, and forwarder-only report delivery. All 17 unit tests pass."

---

## SLIDE 8 — Live Demo

### See It In Action

> Tampilkan 3 screenshot side-by-side:

**Screenshot 1:** Deposit page — Live APY rates dari 4 protocol
- Aave V3: X.XX%
- Compound V3: X.XX%
- Moonwell: X.XX%
- Morpho: X.XX%

**Screenshot 2:** AI Analysis card — setelah optimization
- Confidence bar: 85/100
- Risk Score bar: 91/100
- Weighted Protocol Scores (4 protocol dengan bar chart)
- Score Breakdown (APY, Safety, TVL, Stability)

**Screenshot 3:** Recommendation History — past AI recommendations
- Protocol name, APY, confidence badge, block number

**Try it yourself:** kairosfinance.vercel.app

> Speaker notes: "Here's our live frontend. On the left, you see real-time APY rates fetched directly from on-chain protocol contracts on Base. In the middle, after the AI runs, you get a full analysis — confidence score, risk assessment, weighted scores for every protocol, and a detailed breakdown of why the recommended protocol won. On the right, all past recommendations are stored on-chain and displayed with confidence badges."

---

## SLIDE 9 — Protocol Support

### 4 DeFi Protocols. On-Chain + Off-Chain Data.

| Protocol | Data Source | How APY is Read |
|----------|-----------|-----------------|
| **Aave V3** | On-chain (EVMClient) | `getReserveData()` → liquidityRate |
| **Compound V3** | On-chain (EVMClient) | `getUtilization()` → `getSupplyRate()` |
| **Moonwell** | On-chain (EVMClient) | `supplyRatePerTimestamp()` |
| **Morpho** | Off-chain (HTTPClient) | GraphQL API → best market APY |

**Extensible Design:**
- Add new protocol = deploy one new Strategy Adapter contract
- CRE workflow automatically includes new protocol in AI analysis
- No redeploy needed for existing contracts

> Speaker notes: "We read APY data from 3 protocols directly on-chain using CRE's EVMClient, and from Morpho via their GraphQL API using HTTPClient. This hybrid approach gives us the most accurate, real-time data. And the system is extensible — adding a new protocol is as simple as deploying one new strategy adapter contract."

---

## SLIDE 10 — Tech Stack

### Built with the Best

| Layer | Technology |
|-------|-----------|
| **Blockchain** | Base (Ethereum L2) — low gas, fast finality |
| **Smart Contracts** | Solidity 0.8.24, Foundry, OpenZeppelin v5 |
| **Orchestration** | Chainlink CRE (`@chainlink/cre-sdk` v1.1.1) |
| **AI Engine** | Claude API (Anthropic) — via CRE HTTPClient |
| **Frontend** | Next.js 16, React 19, Tailwind CSS |
| **Auth** | Privy — email, wallet, Google OAuth |
| **Web3** | wagmi v2, viem v2 |
| **Testing** | Foundry (17/17), E2E Forge Script |

> Speaker notes: "We chose Base for its low gas costs and fast finality — perfect for a yield optimizer where gas efficiency matters. Chainlink CRE handles all orchestration. Claude AI provides the intelligence. And our frontend is built with modern web3 stack — Next.js, Privy for seamless onboarding, and wagmi for contract interactions."

---

## SLIDE 11 — Roadmap

### What's Next

**Phase 2 — Cross-Chain (CCIP)**
- Expand to Arbitrum, Optimism, Ethereum mainnet
- Compare yields across chains, not just protocols
- Use Chainlink CCIP for cross-chain fund transfers

**Phase 3 — Multi-Asset**
- Support ETH, WBTC, DAI alongside USDC
- Asset-specific risk models

**Phase 4 — Auto-Rebalancing**
- Cron trigger already built (every 6 hours)
- AI detects when current protocol is no longer optimal
- Automatic migration to better protocol

**Phase 5 — Portfolio Split**
- Allocate across multiple protocols simultaneously
- Diversification-based risk management

> Speaker notes: "Looking ahead, we have a clear roadmap. Phase 2 adds cross-chain yield comparison using Chainlink CCIP. Phase 3 expands to more assets. Phase 4 activates our already-built cron trigger for auto-rebalancing. And Phase 5 enables portfolio splits across multiple protocols. The foundation is all here — these are incremental additions."

---

## SLIDE 12 — Try It Now

### Kairos Finance

**"The right moment to optimize your yield is now."**

- Live Demo: **kairosfinance.vercel.app**
- GitHub: **github.com/yt2025id-lab/kairos-finance**
- Network: **Base Sepolia (testnet)**

**Built for Chainlink Convergence 2025**
CRE & AI Track | DeFi & Tokenization Track

> Speaker notes: "Kairos Finance — the right moment to optimize your yield is now. Try our live demo, check out our GitHub, and see how Chainlink CRE can power the next generation of DeFi intelligence. Thank you."
