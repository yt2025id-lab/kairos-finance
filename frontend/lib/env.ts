/**
 * Environment variable validation and type-safe access
 */

export interface PublicEnv {
  VAULT_ADDRESS: `0x${string}`;
  CONTROLLER_ADDRESS: `0x${string}`;
  PRIVY_APP_ID: string;
  CHAIN_ID: number;
  BASE_RPC?: string;
  BASE_SEPOLIA_RPC?: string;
}

/**
 * Validate required environment variables
 */
export function validateEnv(): Partial<PublicEnv> {
  const env: Partial<PublicEnv> = {
    VAULT_ADDRESS: (process.env.NEXT_PUBLIC_VAULT_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    CONTROLLER_ADDRESS: (process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    PRIVY_APP_ID: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
    CHAIN_ID: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "8453", 10),
    BASE_RPC: process.env.NEXT_PUBLIC_BASE_RPC,
    BASE_SEPOLIA_RPC: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  };

  // Validate required fields
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_VAULT_ADDRESS) {
    errors.push("NEXT_PUBLIC_VAULT_ADDRESS");
  }

  if (!process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS) {
    errors.push("NEXT_PUBLIC_CONTROLLER_ADDRESS");
  }

  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    errors.push("NEXT_PUBLIC_PRIVY_APP_ID");
  }

  // Only log in development (will be tree-shaken in production)
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development" && errors.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      "⚠️  Missing environment variables:",
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
