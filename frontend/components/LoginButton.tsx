"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";

const HAS_PRIVY = !!process.env.NEXT_PUBLIC_PRIVY_APP_ID;

export function LoginButton() {
  if (!HAS_PRIVY) {
    return (
      <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-gray-500">
        Set PRIVY_APP_ID
      </div>
    );
  }

  return <LoginButtonInner />;
}

function LoginButtonInner() {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const { wallets } = useWallets();

  if (!ready) {
    return (
      <div className="px-4 py-2 bg-gray-800 rounded-lg text-sm text-gray-500">
        Loading...
      </div>
    );
  }

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Sign in
      </button>
    );
  }

  const walletAddress = wallets[0]?.address;
  const displayName = user?.email?.address
    || user?.google?.email
    || (walletAddress
      ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
      : "Connected");

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 hidden sm:inline">{displayName}</span>
      <button
        onClick={logout}
        className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

export function LoginCard() {
  if (!HAS_PRIVY) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <p className="text-gray-400 mb-2">
          Privy is not configured. Set NEXT_PUBLIC_PRIVY_APP_ID in .env.local.
        </p>
      </div>
    );
  }

  return <LoginCardInner />;
}

function LoginCardInner() {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) return null;
  if (authenticated) return null;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <p className="text-gray-400 mb-2">
        Sign in with your email or connect a wallet to get started.
      </p>
      <p className="text-xs text-gray-500 mb-4">
        No wallet? No problem. We will create one for you automatically.
      </p>
      <button
        onClick={login}
        className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
      >
        Sign in
      </button>
    </div>
  );
}
