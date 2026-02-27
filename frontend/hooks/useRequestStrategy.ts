/**
 * Hook for requesting AI strategy recommendations
 * Sends request to vault and waits for Chainlink CRE to execute
 */

import { useState, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseAbi } from "viem";
import { VAULT_ADDRESS } from "@/lib/contracts";
import { TxState, UseContractAction } from "@/lib/contracts/types";

export interface RequestStrategyResult {
  timeHorizon: bigint;
  txHash: `0x${string}`;
}

export interface RequestStrategyArgs {
  timeHorizonInDays: number;
}

export function useRequestStrategy(): UseContractAction<
  RequestStrategyResult,
  RequestStrategyArgs
> {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [txState, setTxState] = useState<TxState>({
    status: "idle",
    error: undefined,
  });

  const [data, setData] = useState<RequestStrategyResult>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args?: RequestStrategyArgs) => {
      if (!args) {
        const err = new Error("Time horizon is required");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      const { timeHorizonInDays } = args;

      if (!address) {
        const err = new Error("Wallet not connected");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      if (timeHorizonInDays <= 0) {
        const err = new Error("Time horizon must be greater than 0");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      try {
        setIsPending(true);
        setTxState({ status: "pending" });
        setError(null);

        // Convert days to seconds (unix timestamp)
        const timeHorizonInSeconds = BigInt(timeHorizonInDays * 86400);

        const tx = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: parseAbi([
            "function requestStrategy(uint256 timeHorizon) returns ()",
          ]),
          functionName: "requestStrategy",
          args: [timeHorizonInSeconds],
        });

        const result = {
          timeHorizon: timeHorizonInSeconds,
          txHash: tx as `0x${string}`,
        };

        setTxState({ status: "success", hash: tx as `0x${string}` });
        setData(result);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setTxState({ status: "error", error: error.message });
      } finally {
        setIsPending(false);
      }
    },
    [address, writeContractAsync]
  );

  return {
    data,
    error,
    isPending,
    isSuccess: txState.status === "success",
    isError: txState.status === "error",
    txState,
    execute,
  };
}
