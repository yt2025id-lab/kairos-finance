/**
 * Hook for vault deposits
 * Handles USDC approval and deposit transaction
 */

import { useState, useCallback } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseAbi } from "viem";
import { VAULT_ADDRESS, USDC_ADDRESS, VAULT_ABI, ERC20_ABI } from "@/lib/contracts";
import { parseUSDC } from "@/lib/contracts/helpers";
import { TxState, UseContractAction } from "@/lib/contracts/types";

export interface DepositArgs {
  amount: number;
  receiver?: `0x${string}`;
}

export function useDeposit(): UseContractAction<bigint, DepositArgs> {
  const { address } = useAccount();
  const { writeContractAsync: deposit } = useWriteContract();
  const { writeContractAsync: approve } = useWriteContract();

  const [txState, setTxState] = useState<TxState>({
    status: "idle",
    error: undefined,
  });

  const [data, setData] = useState<bigint>();
  const [error, setError] = useState<Error | null>(null);
  const [isPending, setIsPending] = useState(false);

  const execute = useCallback(
    async (args?: DepositArgs) => {
      if (!args) {
        const err = new Error("Amount is required");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      const { amount, receiver } = args;

      if (!address) {
        const err = new Error("Wallet not connected");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      if (amount <= 0) {
        const err = new Error("Amount must be greater than 0");
        setError(err);
        setTxState({ status: "error", error: err.message });
        return;
      }

      try {
        setIsPending(true);
        setTxState({ status: "pending" });
        setError(null);

        const parsedAmount = parseUSDC(amount);
        const recipient = receiver || address;

        // Step 1: Approve USDC
        await approve({
          address: USDC_ADDRESS,
          abi: parseAbi([
            "function approve(address spender, uint256 amount) returns (bool)",
          ]),
          functionName: "approve",
          args: [VAULT_ADDRESS, parsedAmount],
        });

        // Step 2: Deposit to vault
        const depositTx = await deposit({
          address: VAULT_ADDRESS,
          abi: parseAbi([
            "function deposit(uint256 assets, address receiver) returns (uint256 shares)",
          ]),
          functionName: "deposit",
          args: [parsedAmount, recipient],
        });

        setTxState({ status: "success", hash: depositTx as `0x${string}` });
        setData(parsedAmount);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setTxState({ status: "error", error: error.message });
      } finally {
        setIsPending(false);
      }
    },
    [address, approve, deposit]
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
