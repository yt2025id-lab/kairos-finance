import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

// Base mainnet RPC — uses NEXT_PUBLIC_BASE_MAINNET_RPC if set, otherwise the
// well-known public endpoint. Intentionally does NOT fall back to
// NEXT_PUBLIC_BASE_RPC because that env var is commonly set to a Sepolia URL
// in testnet configurations, which would break all mainnet contract reads.
const BASE_MAINNET_RPC =
  process.env.NEXT_PUBLIC_BASE_MAINNET_RPC || "https://mainnet.base.org";

// Base Sepolia RPC — prefers the explicit Sepolia var, then the generic one.
const BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC ||
  process.env.NEXT_PUBLIC_BASE_RPC ||
  "https://sepolia.base.org";

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(BASE_MAINNET_RPC, {
      retryCount: 3,
      retryDelay: 100,
      timeout: 10000,
    }),
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC, {
      retryCount: 3,
      retryDelay: 100,
      timeout: 10000,
    }),
  },
  ssr: true,
});
