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
    if (positionData && Array.isArray(positionData)) {
      const [
        depositAmount,
        timeHorizon,
        depositTimestamp,
        activeStrategy,
        allocatedAmount,
        isActive,
      ] = positionData;

      setPosition({
        depositAmount: depositAmount as bigint,
        timeHorizon: timeHorizon as bigint,
        depositTimestamp: depositTimestamp as bigint,
        activeStrategy: activeStrategy as `0x${string}`,
        allocatedAmount: allocatedAmount as bigint,
        isActive: isActive as boolean,
      });
    }
  }, [positionData]);

  return {
    shares: (shares as bigint) || BigInt(0),
    sharesFormatted: formatUSDC((shares as bigint) || BigInt(0)),
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
