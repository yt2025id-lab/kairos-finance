/**
 * Hook for reading vault balance and position
 * Queries user's shares and position details
 */

import { useEffect, useState } from "react";
import { useAccount, useReadContract } from "wagmi";
import { parseAbi } from "viem";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { UserPosition } from "@/lib/contracts/types";
import { formatUSDC } from "@/lib/contracts/helpers";

export interface VaultBalance {
  shares: bigint;
  sharesFormatted: number;
  position: UserPosition | null;
  isLoading: boolean;
  error: Error | null;
}

export function useVaultBalance(): VaultBalance {
  const { address } = useAccount();
  const [position, setPosition] = useState<UserPosition | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Read shares (balanceOf)
  const { data: shares, isLoading: sharesLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: parseAbi(["function balanceOf(address account) returns (uint256)"]),
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Read user position
  const { data: positionData, isLoading: positionLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: parseAbi([
      "function getUserPosition(address user) returns ((uint256 depositAmount, uint256 timeHorizon, uint256 depositTimestamp, address activeStrategy, uint256 allocatedAmount, bool isActive))",
    ]),
    functionName: "getUserPosition",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Parse position data
  useEffect(() => {
    if (positionData && typeof positionData === 'object' && Array.isArray(positionData)) {
      const data = positionData as any[];
      if (data.length === 6) {
        try {
          setPosition({
            depositAmount: data[0] as bigint,
            timeHorizon: data[1] as bigint,
            depositTimestamp: data[2] as bigint,
            activeStrategy: data[3] as `0x${string}`,
            allocatedAmount: data[4] as bigint,
            isActive: data[5] as boolean,
          });
        } catch (err) {
          setError(new Error("Failed to parse position data"));
        }
      }
    }
  }, [positionData]);

  return {
    shares: (shares as bigint | undefined) ?? BigInt(0),
    sharesFormatted: formatUSDC((shares as bigint | undefined) ?? BigInt(0)),
    position,
    isLoading: sharesLoading || positionLoading,
    error,
  };
}

/**
 * Hook for reading total vault assets
 */
export function useTotalVaultAssets() {
  const { data: totalAssets, isLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: parseAbi(["function totalAssets() returns (uint256)"]),
    functionName: "totalAssets",
  });

  return {
    totalAssets: (totalAssets as bigint) || BigInt(0),
    totalAssetsFormatted: formatUSDC((totalAssets as bigint) || BigInt(0)),
    isLoading,
  };
}

/**
 * Hook for checking if user has active strategy request
 */
export function useHasActiveRequest() {
  const { address } = useAccount();
  const { data: hasActiveRequest, isLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: parseAbi([
      "function hasActiveRequest(address user) returns (bool)",
    ]),
    functionName: "hasActiveRequest",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    hasActiveRequest: (hasActiveRequest as boolean) || false,
    isLoading,
  };
}
