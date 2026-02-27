/**
 * Hook for vault withdrawals
 * Handles redeem and withdraw transactions
 */

import { useState, useCallback } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { parseAbi } from "viem";
import { VAULT_ADDRESS, VAULT_ABI } from "@/lib/contracts";
import { parseUSDC } from "@/lib/contracts/helpers";
import { TxState, UseContractAction } from "@/lib/contracts/types";

export interface WithdrawArgs {
  amountOrShares: number;
  isShares?: boolean;
  receiver?: `0x${string}`;
}

export function useWithdraw(): UseContractAction<bigint, WithdrawArgs> {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  const [txState, setTxState] = useState<TxState>({
    status: "idle",
    error: undefined,
  });

  const [data, setData] = useState<bigint>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args?: WithdrawArgs) => {
      if (!args) {
        const err = new Error("Withdraw amount is required");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      const { amountOrShares, isShares = false, receiver } = args;

      if (!address) {
        const err = new Error("Wallet not connected");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      if (amountOrShares <= 0) {
        const err = new Error("Amount must be greater than 0");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      try {
        setIsPending(true);
        setTxState({ status: "pending" });
        setError(null);

        const parsedAmount = isShares
          ? BigInt(Math.floor(amountOrShares))
          : parseUSDC(amountOrShares);

        const recipient = receiver || address;

        // Choose withdraw or redeem based on isShares
        const functionName = isShares ? "redeem" : "withdraw";
        const args = [parsedAmount, recipient, address];

        const tx = await writeContractAsync({
          address: VAULT_ADDRESS,
          abi: parseAbi([
            isShares
              ? "function redeem(uint256 shares, address receiver, address owner) returns (uint256 assets)"
              : "function withdraw(uint256 assets, address receiver, address owner) returns (uint256 shares)",
          ]),
          functionName,
          args,
        });

        setTxState({ status: "success", hash: tx as `0x${string}` });
        setData(parsedAmount);
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
