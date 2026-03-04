"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

const HAS_PRIVY = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * Returns the active wallet address from Privy.
 * Works for both:
 * - Email/social users (embedded wallet created automatically)
 * - Traditional wallet users (MetaMask, Coinbase Wallet, etc.)
 *
 * Falls back gracefully when Privy is not configured.
 */
export function useActiveWallet() {
  if (!HAS_PRIVY) {
    // Privy not configured - return disconnected state
    return {
      ready: true,
      authenticated: false,
      address: undefined as `0x${string}` | undefined,
      isConnected: false,
      wallet: undefined,
      chainId: undefined,
    };
  }

  return useActiveWalletWithPrivy();
}

function useActiveWalletWithPrivy() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets[0];
  const address = activeWallet?.address as `0x${string}` | undefined;

  // Privy wallet.chainId is CAIP-2 format: "eip155:84532"
  const chainId = activeWallet?.chainId
    ? parseInt(activeWallet.chainId.split(":")[1], 10)
    : undefined;

  return {
    ready,
    authenticated,
    address,
    isConnected: ready && authenticated && !!address,
    wallet: activeWallet,
    chainId,
  };
}
