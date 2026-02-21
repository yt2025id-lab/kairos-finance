"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "../lib/wagmi";
import { useState } from "react";
import { baseSepolia, base } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  // Skip Privy initialization if no app ID is configured
  if (!PRIVY_APP_ID) {
    return <>{children}</>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#3b82f6",
          showWalletLoginFirst: false,
        },
        loginMethods: ["email", "wallet", "google"],
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        defaultChain: baseSepolia,
        supportedChains: [baseSepolia, base],
      }}
    >
      {children}
    </PrivyProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PrivyWrapper>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          {children}
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyWrapper>
  );
}
