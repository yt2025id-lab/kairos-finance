# Kairos Finance — Frontend

Next.js 15 web application for Kairos Finance — AI-powered yield optimization on Base.

---

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 (App Router) |
| Web3 | wagmi v2 + viem v2 |
| Authentication | Privy v3 (email + embedded wallet) |
| Data Fetching | TanStack Query v5 |
| Styling | Tailwind CSS v4 |
| Package Manager | Bun |

---

## Testnet Contract Addresses (Base Sepolia — Chain ID: 84532)

> Deployed: 2026-03-01

| Variable | Address |
|----------|---------|
| `NEXT_PUBLIC_VAULT_ADDRESS` | `0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855` |
| `NEXT_PUBLIC_CONTROLLER_ADDRESS` | `0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF` |
| `NEXT_PUBLIC_USDC_ADDRESS` | `0x4F6D082b3130745687dd200822280946125570F5` |
| `NEXT_PUBLIC_FAUCET_ADDRESS` | `0x4F6D082b3130745687dd200822280946125570F5` |

> `FaucetUSDC` is a single contract that acts as both the ERC-20 token and the testnet faucet — `USDC_ADDRESS` and `FAUCET_ADDRESS` point to the same contract.

---

## Setup

### 1. Install dependencies

```bash
bun install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` with the values below. **Never commit this file.**

#### Required

```env
NEXT_PUBLIC_VAULT_ADDRESS=0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855
NEXT_PUBLIC_CONTROLLER_ADDRESS=0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF
NEXT_PUBLIC_CHAIN_ID=84532
NEXT_PUBLIC_PRIVY_APP_ID=<your-privy-app-id>
```

#### Optional

```env
NEXT_PUBLIC_BASE_SEPOLIA_RPC=<custom-rpc-url>   # falls back to public if not set
NEXT_PUBLIC_USDC_ADDRESS=0x4F6D082b3130745687dd200822280946125570F5
NEXT_PUBLIC_FAUCET_ADDRESS=0x4F6D082b3130745687dd200822280946125570F5
```

Get a Privy App ID at [console.privy.io](https://console.privy.io).

### 3. Run development server

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
frontend/
├── app/
│   ├── page.tsx                Landing page
│   ├── deposit/
│   │   └── page.tsx            Deposit + dashboard page
│   └── layout.tsx              Root layout with providers
├── components/
│   ├── NetworkGuard.tsx        Enforces correct chain before wallet actions
│   ├── LoginButton.tsx         Privy login/logout button
│   ├── TransactionButton.tsx   Reusable tx button with pending/success/error states
│   └── EnvWarning.tsx          Dev-mode warning for missing env vars
├── hooks/
│   ├── useDeposit.ts           Approve + deposit USDC into KairosVault
│   ├── useWithdraw.ts          Redeem shares / withdraw USDC from vault
│   ├── useRequestStrategy.ts   Call requestStrategy(timeHorizon) on vault
│   ├── useVaultBalance.ts      Read user shares + active position data
│   └── index.ts                Barrel export
├── lib/
│   ├── wagmi.ts                wagmi config with RPC fallback transport
│   └── contracts/
│       ├── abis.ts             KairosVault, KairosController, ERC20, FaucetUSDC ABIs
│       ├── addresses.ts        Contract addresses from env vars
│       └── index.ts            Barrel export
└── .env.example                Environment variable template
```

---

## Key Hooks

| Hook | Description |
|------|-------------|
| `useDeposit()` | Approve USDC allowance then deposit into vault; returns `execute(amount)` |
| `useWithdraw()` | Redeem vault shares for USDC; supports both `withdraw` and `redeem` |
| `useRequestStrategy()` | Triggers the CRE workflow by calling `requestStrategy(timeHorizon)` |
| `useVaultBalance()` | Reads user's share balance and active position (`UserPosition` struct) |

---

## Pages

### Landing (`/`)
Introduction, product overview, and connect wallet CTA.

### Deposit & Dashboard (`/deposit`)
- **Faucet**: Claim testnet USDC (Base Sepolia only)
- **Deposit**: Approve + deposit USDC into the vault
- **Request Strategy**: Trigger AI yield optimization
- **Dashboard**: View active position, current protocol, expected APY
- **Withdraw**: Redeem shares back to USDC

---

## Build & Deploy

```bash
# Type check
bun run type-check

# Lint
bun run lint

# Production build
bun run build

# Start production server
bun run start
```

### Vercel Deployment

Set all `NEXT_PUBLIC_*` environment variables in your Vercel project settings. The app is static-export compatible for edge deployment.

---

## Environment Variables Reference

See [`.env.example`](.env.example) for the full list with descriptions.

> All `NEXT_PUBLIC_*` variables are embedded into the client bundle at build time. Never put secrets (API keys, private keys) in `NEXT_PUBLIC_*` variables.

---

## License

MIT
