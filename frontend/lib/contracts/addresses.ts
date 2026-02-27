/**
 * Smart Contract Addresses on Base Mainnet
 * These should be configured via environment variables
 */

import { getPublicEnv } from "../env";

const env = getPublicEnv();

/**
 * KairosVault contract - handles deposits, withdrawals, and strategy requests
 */
export const VAULT_ADDRESS = env.VAULT_ADDRESS;

/**
 * KairosController contract - handles strategy recommendations and executions
 */
export const CONTROLLER_ADDRESS = env.CONTROLLER_ADDRESS;

/**
 * USDC token on Base
 * @see https://basescan.org/token/0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
 */
export const USDC_ADDRESS = (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
  "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`;

/**
 * Testnet USDC faucet contract (Base Sepolia)
 * Must be set via NEXT_PUBLIC_FAUCET_ADDRESS for testnet usage
 */
export const FAUCET_ADDRESS = (process.env.NEXT_PUBLIC_FAUCET_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

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
