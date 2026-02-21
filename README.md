# Kairos Finance

**AI-Powered Yield Optimization on Base, Orchestrated by Chainlink CRE**

Deposit USDC, set your time horizon, and let AI find the best lending rate across Aave, Compound, Moonwell, and Morpho on Base.

- [Full Documentation](docs/README.md)
- [Chainlink Integration Details](docs/CHAINLINK_INTEGRATION.md)

## Quick Start

```bash
# Smart Contracts
cd contracts && forge build && forge test -vv

# CRE Workflow (uses @chainlink/cre-sdk)
cd cre-workflow && npm install && npm run build

# Frontend
cd frontend && npm install && npm run dev

# End-to-End Demo (Base Sepolia)
cd contracts && forge script script/DemoE2E.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast -vvvv
```

## Chainlink Products Used

| Product | Purpose |
|---------|---------|
| CRE Workflow | Core orchestration |
| CRE EVMClient | On-chain APY reads (3 protocols) |
| CRE HTTPClient | Claude AI + Morpho API |
| CRE writeReport | On-chain recommendation delivery |
| CRE Secrets | API key management |
| CRE Cron Trigger | Periodic rebalancing |

## Tests

17/17 smart contract tests passing. Run `cd contracts && forge test -vv`.

## License

MIT
