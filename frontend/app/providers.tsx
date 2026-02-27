"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "../lib/wagmi";
import { useState, useEffect } from "react";
import { baseSepolia, base } from "viem/chains";
import { getPublicEnv } from "../lib/env";
import { NetworkGuard, EnvWarning } from "../components";

const env = getPublicEnv();
const PRIVY_APP_ID = env.PRIVY_APP_ID;

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show warning if Privy is not configured
  if (!mounted) {
    return <>{children}</>;
  }

  if (!PRIVY_APP_ID) {
    // Privy disabled - pass through children
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
        defaultChain: base,
        supportedChains: [base, baseSepolia],
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
          <EnvWarning>
            <NetworkGuard allowedChains={base}>{children}</NetworkGuard>
          </EnvWarning>
        </WagmiProvider>
      </QueryClientProvider>
    </PrivyWrapper>
  );
}

