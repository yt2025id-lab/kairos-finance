/**
 * Smart Contract Addresses on Base Mainnet
 * These should be configured via environment variables
 *
 * FIX: Sanitize all addresses to remove trailing whitespace/newlines
 * that can be introduced by Vercel environment variable handling.
 * Use viem's getAddress() to validate and normalize to EIP-55 checksum format.
 */

import { getAddress } from "viem";
import { getPublicEnv } from "../env";

const env = getPublicEnv();

/**
 * Helper: Clean and validate contract addresses
 * Removes whitespace, validates hex format, and normalizes to EIP-55 checksum
 */
function cleanAddress(address?: string): `0x${string}` {
  if (!address) {
    throw new Error("Address is required but was not provided");
  }

  const trimmed = address.trim();

  if (!trimmed.startsWith("0x")) {
    throw new Error(
      `Invalid address format: "${trimmed}" - must start with 0x`
    );
  }

  try {
    // getAddress validates the format and returns EIP-55 checksum format
    return getAddress(trimmed);
  } catch (error) {
    throw new Error(
      `Invalid address: "${trimmed}" - ${error instanceof Error ? error.message : "unknown error"}`
    );
  }
}

/**
 * KairosVault contract - handles deposits, withdrawals, and strategy requests
 */
export const VAULT_ADDRESS = cleanAddress(env.VAULT_ADDRESS);

/**
 * KairosController contract - handles strategy recommendations and executions
 */
export const CONTROLLER_ADDRESS = cleanAddress(env.CONTROLLER_ADDRESS);

/**
 * USDC token on Base
 * @see https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
export const USDC_ADDRESS = cleanAddress(
  process.env.NEXT_PUBLIC_USDC_ADDRESS ||
    "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
);

/**
 * Testnet USDC faucet contract (Base Sepolia)
 * Must be set via NEXT_PUBLIC_FAUCET_ADDRESS for testnet usage
 */
export const FAUCET_ADDRESS = cleanAddress(
  process.env.NEXT_PUBLIC_FAUCET_ADDRESS ||
    "0x0000000000000000000000000000000000000000"
);

/**
 * Log contract addresses for debugging
 * These are now sanitized and EIP-55 checksum formatted
 */
if (typeof window !== "undefined") {
  console.log("[Contracts] ✅ Sanitized contract addresses loaded:", {
    VAULT_ADDRESS,
    CONTROLLER_ADDRESS,
    USDC_ADDRESS,
    FAUCET_ADDRESS,
  });
}

/**
 * Validate that critical contract addresses are set
 */
export function validateContractAddresses(): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (
    VAULT_ADDRESS === "0x0000000000000000000000000000000000000000" ||
    !VAULT_ADDRESS
  ) {
    errors.push("VAULT_ADDRESS not configured");
  }

  if (
    CONTROLLER_ADDRESS === "0x0000000000000000000000000000000000000000" ||
    !CONTROLLER_ADDRESS
  ) {
    errors.push("CONTROLLER_ADDRESS not configured");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
