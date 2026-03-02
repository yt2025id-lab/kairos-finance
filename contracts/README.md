# Kairos Finance — Smart Contracts

Solidity smart contracts for Kairos Finance, built with Foundry and OpenZeppelin v5.

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

## Contract Overview

| Contract | Description |
|----------|-------------|
| `KairosVault` | ERC-4626 tokenized vault. Accepts USDC deposits, mints `kYLD` shares, emits `StrategyRequested` events to trigger the CRE workflow |
| `KairosController` | CRE `IReceiver` consumer. Receives signed AI recommendations via `onReport()`, validates them, and dispatches funds to the selected strategy adapter |
| `AaveV3Strategy` | Strategy adapter — deposits/withdraws USDC from Aave V3 on Base |
| `CompoundV3Strategy` | Strategy adapter — deposits/withdraws USDC from Compound V3 (Comet) on Base |
| `MoonwellStrategy` | Strategy adapter — deposits/withdraws USDC from Moonwell on Base |
| `MorphoStrategy` | Strategy adapter — deposits/withdraws USDC from a MetaMorpho vault on Base |
| `FaucetUSDC` | Testnet-only. ERC-20 token + faucet combined — used as mock USDC on Base Sepolia |

---

## Project Structure

```
contracts/
├── src/
│   ├── vault/
│   │   └── KairosVault.sol         ERC-4626 vault, StrategyRequested event
│   ├── controller/
│   │   └── KairosController.sol    CRE IReceiver, onReport(), strategy dispatch
│   ├── strategies/
│   │   ├── AaveV3Strategy.sol      Aave V3 adapter
│   │   ├── CompoundV3Strategy.sol  Compound V3 adapter
│   │   ├── MoonwellStrategy.sol    Moonwell adapter
│   │   └── MorphoStrategy.sol      MetaMorpho adapter
│   ├── interfaces/
│   │   ├── IStrategy.sol           Common strategy interface
│   │   ├── IReceiver.sol           Chainlink CRE receiver interface
│   │   └── external/               Aave, Compound, Moonwell, Morpho interfaces
│   ├── libraries/
│   │   ├── DataTypes.sol           Shared structs and enums
│   │   └── ProtocolRegistry.sol    Base mainnet protocol addresses
│   └── mocks/
│       └── FaucetUSDC.sol          Testnet mock token + faucet
├── script/
│   ├── DeployTestnet.s.sol         Deploys to Base Sepolia
│   ├── Deploy.s.sol                Deploys to Base Mainnet
│   └── DemoE2E.s.sol               End-to-end demo (6 steps)
└── test/
    └── KairosVaultController.t.sol  17 unit tests
```

---

## Setup

### Prerequisites

```bash
# Install Foundry
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

### Install Dependencies

```bash
cd contracts
forge install
```

### Configure Environment

```bash
cp .env.example .env
# Edit .env — fill in PRIVATE_KEY and RPC URLs
# DO NOT commit .env to git
```

Required variables in `.env`:

| Variable | Description |
|----------|-------------|
| `PRIVATE_KEY` | Deployer private key (with `0x` prefix) |
| `BASE_SEPOLIA_RPC_URL` | Base Sepolia RPC endpoint |
| `BASE_RPC_URL` | Base Mainnet RPC endpoint |
| `BASESCAN_API_KEY` | For contract verification on BaseScan |

---

## Build & Test

```bash
# Build
forge build

# Run all tests
forge test -vv

# Run specific test
forge test --match-test test_deposit -vvvv

# Gas snapshot
forge snapshot
```

**Tests: 17/17 passing**

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
```

---

## Deploy

### Base Sepolia (Testnet)

```bash
forge script script/DeployTestnet.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast -vvvv
```

### Base Mainnet

```bash
# Ensure CRE_FORWARDER and MORPHO_VAULT are set in .env
forge script script/Deploy.s.sol \
  --rpc-url $BASE_RPC_URL \
  --broadcast -vvvv
```

---

## Verify Contracts

```bash
# KairosVault
forge verify-contract 0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855 \
  src/vault/KairosVault.sol:KairosVault \
  --chain base-sepolia \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" \
      0x4F6D082b3130745687dd200822280946125570F5 \
      0x9758D17ac40DE15b52386990a40d4f5C44c8305A) \
  --watch

# KairosController
forge verify-contract 0x84A7C62dAa0DE17b0f01238443d7aBB942A00bfF \
  src/controller/KairosController.sol:KairosController \
  --chain base-sepolia \
  --etherscan-api-key $BASESCAN_API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" \
      0x5c4B8427fBF6F398C4F780711507E0AA2dEdc855 \
      0x9758D17ac40DE15b52386990a40d4f5C44c8305A \
      0x9758D17ac40DE15b52386990a40d4f5C44c8305A) \
  --watch
```

---

## End-to-End Demo

Proves the full Kairos Finance flow on Base Sepolia:

```bash
forge script script/DemoE2E.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --broadcast -vvvv
```

Steps: faucet claim → deposit → request strategy → AI report delivery → position verification → withdrawal.

---

## License

MIT
