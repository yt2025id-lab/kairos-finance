#!/usr/bin/env bash
# verify_all.sh — verifikasi semua kontrak Kairos Finance ke BaseScan
# Usage: bash verify_all.sh
# Note: Requires BASESCAN_API_KEY in .env file

set -e

# Load environment variables
if [ ! -f .env ]; then
  echo "❌ Error: .env file not found in current directory"
  echo "Please run this script from the contracts/ directory"
  exit 1
fi

source .env

# Check if API key is set
if [ -z "$BASESCAN_API_KEY" ]; then
  echo "❌ Error: BASESCAN_API_KEY not set in .env"
  echo "Get one at: https://basescan.org/myapikey"
  exit 1
fi

CHAIN="base-sepolia"
API_KEY="$BASESCAN_API_KEY"

echo "🔍 Starting contract verification on BaseScan (Base Sepolia)..."
echo ""

# Verify FaucetUSDC (no constructor args)
echo "1️⃣  Verifying FaucetUSDC..."
forge verify-contract 0x4F6D082b3130745687dd200822280946125570F5 src/mocks/FaucetUSDC.sol:FaucetUSDC \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --watch

echo "✅ FaucetUSDC verified!"
echo ""

# Verify KairosVault
echo "2️⃣  Verifying KairosVault..."
forge verify-contract $KAIROS_VAULT src/vault/KairosVault.sol:KairosVault \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address)" $USDC_ADDRESS $DEPLOYER) \
  --watch

echo "✅ KairosVault verified!"
echo ""

# Verify KairosController
echo "3️⃣  Verifying KairosController..."
forge verify-contract $KAIROS_CONTROLLER src/controller/KairosController.sol:KairosController \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $KAIROS_VAULT $CRE_FORWARDER $DEPLOYER) \
  --watch

echo "✅ KairosController verified!"
echo ""

# Verify AaveV3Strategy
echo "4️⃣  Verifying AaveV3Strategy..."
forge verify-contract $AAVE_STRATEGY src/strategies/AaveV3Strategy.sol:AaveV3Strategy \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $AAVE_POOL $KAIROS_VAULT $DEPLOYER) \
  --watch

echo "✅ AaveV3Strategy verified!"
echo ""

# Verify CompoundV3Strategy
echo "5️⃣  Verifying CompoundV3Strategy..."
forge verify-contract $COMPOUND_STRATEGY src/strategies/CompoundV3Strategy.sol:CompoundV3Strategy \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $COMET_USDC $KAIROS_VAULT $DEPLOYER) \
  --watch

echo "✅ CompoundV3Strategy verified!"
echo ""

# Verify MoonwellStrategy
echo "6️⃣  Verifying MoonwellStrategy..."
forge verify-contract $MOONWELL_STRATEGY src/strategies/MoonwellStrategy.sol:MoonwellStrategy \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address,address)" $MOONWELL_MUSDC $USDC_ADDRESS $KAIROS_VAULT $DEPLOYER) \
  --watch

echo "✅ MoonwellStrategy verified!"
echo ""

# Verify MorphoStrategy
echo "7️⃣  Verifying MorphoStrategy..."
forge verify-contract $MORPHO_STRATEGY src/strategies/MorphoStrategy.sol:MorphoStrategy \
  --chain $CHAIN \
  --etherscan-api-key $API_KEY \
  --constructor-args $(cast abi-encode "constructor(address,address,address)" $MORPHO_VAULT_ADDRESS $KAIROS_VAULT $DEPLOYER) \
  --watch

echo "✅ MorphoStrategy verified!"
echo ""

echo "🎉 All 7 contracts verified on BaseScan!"
echo ""
echo "📍 View verified contracts:"
echo "   FaucetUSDC: https://sepolia.basescan.org/address/0x4F6D082b3130745687dd200822280946125570F5#code"
echo "   KairosVault: https://sepolia.basescan.org/address/$KAIROS_VAULT#code"
echo "   KairosController: https://sepolia.basescan.org/address/$KAIROS_CONTROLLER#code"
echo "   AaveV3Strategy: https://sepolia.basescan.org/address/$AAVE_STRATEGY#code"
echo "   CompoundV3Strategy: https://sepolia.basescan.org/address/$COMPOUND_STRATEGY#code"
echo "   MoonwellStrategy: https://sepolia.basescan.org/address/$MOONWELL_STRATEGY#code"
echo "   MorphoStrategy: https://sepolia.basescan.org/address/$MORPHO_STRATEGY#code"
