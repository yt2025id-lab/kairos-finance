"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "../lib/wagmi";
import { useState, useEffect } from "react";
import { baseSepolia, base } from "viem/chains";

const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || "";

/**
 * WARNING: Missing Privy App ID
 * This component renders when PRIVY_APP_ID is not configured.
 * Users will see the app, but wallet login will not function.
 */
function MissingPrivyWarning({ children }: { children: React.ReactNode }) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return <>{children}</>;

  return (
    <>
      <div className="fixed top-0 left-0 right-0 bg-red-900/90 border-b border-red-700 p-4 z-50">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1">
            <h3 className="font-bold text-red-100">⚠️ Critical: Privy Not Configured</h3>
            <p className="text-sm text-red-200 mt-1">
              <code className="bg-red-950 px-1.5 py-0.5 rounded text-xs">NEXT_PUBLIC_PRIVY_APP_ID</code> is missing.
              Wallet login will not work. See .env.example for setup.
            </p>
          </div>
          <button
            onClick={() => setHidden(true)}
            className="flex-shrink-0 text-red-200 hover:text-red-100 text-xl"
          >
            ✕
          </button>
        </div>
      </div>
      {children}
    </>
  );
}

function PrivyWrapper({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Skip Privy during SSR/prerendering
  if (!mounted) {
    return <>{children}</>;
  }

  // Show warning if Privy not configured, but still render children
  if (!PRIVY_APP_ID) {
    return <MissingPrivyWarning>{children}</MissingPrivyWarning>;
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
