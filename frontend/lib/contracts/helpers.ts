/**
 * Helper utilities for contract interactions
 */

import { getPublicClient } from "wagmi/actions";
import { VAULT_ABI, ERC20_ABI, CONTROLLER_ABI } from "./abis";
import { VAULT_ADDRESS, CONTROLLER_ADDRESS, USDC_ADDRESS } from "./addresses";
import { base } from "wagmi/chains";
import { config } from "../wagmi";

/**
 * Create a contract read helper
 */
export function createVaultContract() {
  return {
    address: VAULT_ADDRESS,
    abi: VAULT_ABI,
  };
}

export function createERC20Contract(tokenAddress = USDC_ADDRESS) {
  return {
    address: tokenAddress,
    abi: ERC20_ABI,
  };
}

export function createControllerContract() {
  return {
    address: CONTROLLER_ADDRESS,
    abi: CONTROLLER_ABI,
  };
}

/**
 * Format currency values
 */
export function formatUSDC(value: bigint, decimals = 6): number {
  return Number(value) / Math.pow(10, decimals);
}

/**
 * Convert currency to contract format
 */
export function parseUSDC(value: number, decimals = 6): bigint {
  return BigInt(Math.floor(value * Math.pow(10, decimals)));
}

/**
 * Get public client for reads
 */
export async function getBasePublicClient() {
  try {
    const client = await getPublicClient(config, { chainId: base.id });
    return client;
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.error("Failed to get public client:", error);
    }
    return null;
  }
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, chars = 6): string {
  if (!hash) return "";
  return `${hash.slice(0, chars)}...${hash.slice(-chars)}`;
}
