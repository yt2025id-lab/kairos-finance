#!/bin/bash
# Kairos Finance - Network Switcher Script
# Easy way to switch between Base Mainnet and Base Sepolia testnet

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

echo "🔄 Kairos Finance - Network Switcher"
echo "════════════════════════════════════"
echo ""
echo "Current config:"
grep "NEXT_PUBLIC_CHAIN_ID\|NEXT_PUBLIC_VAULT_ADDRESS" "$FRONTEND_DIR/.env.local" | head -3
echo ""
echo "Options:"
echo "  1) Switch to Base Sepolia testnet (with faucet)"
echo "  2) Switch to Base Mainnet"
echo "  3) Show current config"
echo ""

read -p "Choose (1-3): " choice

case $choice in
  1)
    echo "📋 Setup instructions for Base Sepolia testnet:"
    echo ""
    echo "1. Deploy contracts to Base Sepolia:"
    echo "   cd contracts"
    echo "   forge script script/DeployTestnet.s.sol \\"
    echo "     --rpc-url https://sepolia.base.org \\"
    echo "     --broadcast -vvvv"
    echo ""
    echo "2. Update .env.local with deployed addresses (copy from .env.testnet.example)"
    echo ""
    echo "3. Restart dev server: npm run dev"
    echo ""
    echo "After deployment, update these in .env.local:"
    echo "  NEXT_PUBLIC_CHAIN_ID=84532"
    echo "  NEXT_PUBLIC_VAULT_ADDRESS=<sepolia-vault>"
    echo "  NEXT_PUBLIC_CONTROLLER_ADDRESS=<sepolia-controller>"
    echo "  NEXT_PUBLIC_USDC_ADDRESS=<sepolia-usdc>"
    echo "  NEXT_PUBLIC_FAUCET_ADDRESS=<sepolia-faucet>"
    ;;
    
  2)
    echo "✅ Base Mainnet config:"
    echo ""
    echo "Current addresses in .env.local are:"
    grep "NEXT_PUBLIC_VAULT_ADDRESS\|NEXT_PUBLIC_CONTROLLER_ADDRESS\|NEXT_PUBLIC_USDC_ADDRESS" \
      "$FRONTEND_DIR/.env.local" | grep -v "^#"
    echo ""
    echo "Chain ID: 8453"
    echo "Note: Faucet is not available on mainnet"
    ;;
    
  3)
    echo "Current configuration:"
    grep "NEXT_PUBLIC" "$FRONTEND_DIR/.env.local" | grep -v "^#" | sort
    ;;
    
  *)
    echo "Invalid choice"
    exit 1
    ;;
esac
