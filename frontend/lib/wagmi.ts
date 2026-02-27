import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

// RPC endpoints with fallback support
const BASE_RPC = process.env.NEXT_PUBLIC_BASE_RPC || "https://mainnet.base.org";
const BASE_SEPOLIA_RPC =
  process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || "https://sepolia.base.org";

export const config = createConfig({
  chains: [base, baseSepolia],
  transports: {
    [base.id]: http(BASE_RPC, {
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
