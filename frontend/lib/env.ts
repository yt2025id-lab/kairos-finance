/**
 * Environment variable validation and type-safe access
 * 
 * CRITICAL: NEXT_PUBLIC_PRIVY_APP_ID must be set for production deployment
 * Missing this will break wallet authentication in deployed apps
 */

export interface PublicEnv {
  VAULT_ADDRESS: `0x${string}`;
  CONTROLLER_ADDRESS: `0x${string}`;
  USDC_ADDRESS: `0x${string}`;
  PRIVY_APP_ID: string;
  CHAIN_ID: number;
  BASE_RPC?: string;
  BASE_SEPOLIA_RPC?: string;
}

/**
 * Validate required environment variables
 * 
 * PRODUCTION: All contract addresses and PRIVY_APP_ID must be configured
 * DEVELOPMENT: Missing values will show warnings in console
 */
export function validateEnv(): Partial<PublicEnv> {
  const env: Partial<PublicEnv> = {
    VAULT_ADDRESS: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    CONTROLLER_ADDRESS: (process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    USDC_ADDRESS: (process.env.NEXT_PUBLIC_USDC_ADDRESS ||
      "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913") as `0x${string}`,
    PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
    CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "8453", 10),
    BASE_RPC: process.env.NEXT_PUBLIC_BASE_RPC,
    BASE_SEPOLIA_RPC: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  };

  // Validate required fields
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check critical authentication variable
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    const msg = "NEXT_PUBLIC_PRIVY_APP_ID (wallet login will not work)";
    if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
      errors.push(msg);
    } else {
      warnings.push(msg);
    }
  }

  // Check contract addresses
  if (!process.env.NEXT_PUBLIC_VAULT_ADDRESS) {
    errors.push("NEXT_PUBLIC_VAULT_ADDRESS");
  }

  if (!process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS) {
    errors.push("NEXT_PUBLIC_CONTROLLER_ADDRESS");
  }

  // Log warnings in development and testing
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
    if (warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        "⚠️  Missing recommended environment variables:",
        warnings.join(", ")
      );
    }
  }

  // Log errors in all environments client-side
  if (typeof window !== "undefined" && errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(
      "🚨 Missing critical environment variables:",
      errors.join(", ")
    );
  }

  return env;
}

/**
 * Get validated environment safely
 */
export function getPublicEnv(): PublicEnv {
  const env = validateEnv();
  return env as PublicEnv;
}

/**
 * Check if all required env vars are set
 */
export function isEnvConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_VAULT_ADDRESS &&
    process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS &&
    process.env.NEXT_PUBLIC_PRIVY_APP_ID
  );
}
