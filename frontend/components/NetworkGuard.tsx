/**
 * Network Guard Component
 * Shows warning if user is not on Base network
 * Prevents interaction with contracts on wrong network
 */

import React from "react";
import { useChainId, useSwitchChain } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

interface NetworkGuardProps {
  children: React.ReactNode;
  allowedChains?: typeof base | typeof baseSepolia;
}

export function NetworkGuard({
  children,
  allowedChains = base,
}: NetworkGuardProps) {
  const chainId = useChainId();
  const { switchChainAsync } = useSwitchChain();

  const isCorrectNetwork = chainId === allowedChains.id;

  const handleSwitchNetwork = async () => {
    try {
      await switchChainAsync({ chainId: allowedChains.id });
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        // eslint-disable-next-line no-console
        console.error("Failed to switch network:", error);
      }
    }
  };

  if (!isCorrectNetwork) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          {/* Warning Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            Wrong Network
          </h1>

          <p className="text-center text-gray-600 mb-6">
            This application runs on <strong>{allowedChains.name}</strong>.
            Please switch your wallet to continue.
          </p>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-orange-800">
              <strong>Current Network:</strong> {base.name} (Chain ID: {chainId})
            </p>
            <p className="text-sm text-orange-800 mt-1">
              <strong>Required Network:</strong> {allowedChains.name} (Chain ID:{" "}
              {allowedChains.id})
            </p>
          </div>

          <button
            onClick={handleSwitchNetwork}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors duration-200"
          >
            Switch to {allowedChains.name}
          </button>

          <p className="text-center text-gray-500 text-xs mt-4">
            Make sure your wallet supports {allowedChains.name}
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
