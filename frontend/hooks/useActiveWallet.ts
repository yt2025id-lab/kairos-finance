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
    };
  }

  return useActiveWalletWithPrivy();
}

function useActiveWalletWithPrivy() {
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const activeWallet = wallets[0];
  const address = activeWallet?.address as `0x${string}` | undefined;

  return {
    ready,
    authenticated,
    address,
    isConnected: ready && authenticated && !!address,
    wallet: activeWallet,
  };
}
