"use client";

import { useState, useEffect } from "react";
import {
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useChainId,
  useSwitchChain,
} from "wagmi";
import { parseUnits, formatUnits } from "viem";
import {
  VAULT_ADDRESS,
  VAULT_ABI,
  USDC_ADDRESS,
  ERC20_ABI,
} from "../lib/contracts";

// ---------------------------------------------------------------------------
// State machine types
// ---------------------------------------------------------------------------

export type DepositStep =
  | "idle"        // waiting for user input
  | "approving"   // approve tx in flight (wallet prompt → on-chain confirmation)
  | "depositing"  // deposit tx in flight (wallet prompt → on-chain confirmation)
  | "success"     // deposit confirmed on-chain
  | "error";      // wallet rejection, validation failure, or on-chain revert

export interface DepositFlowState {
  // Input
  amount: string;
  setAmount: (v: string) => void;

  // State machine
  step: DepositStep;
  errorMessage: string | null;
  dismissError: () => void;

  // On-chain data
  usdcBalance: bigint | undefined;
  parsedAmount: bigint;
  needsApproval: boolean;

  // Derived booleans for UI
  isPending: boolean;        // true while any tx is in flight
  canSubmit: boolean;        // false when idle but input is invalid
  isCorrectNetwork: boolean; // true when wallet is on the expected chain
  networkError: string | null; // non-null when wallet is on the wrong chain

  // Actions
  handleAction: () => Promise<void>;
  switchNetwork: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

const EXPECTED_CHAIN_ID = Number(process.env.NEXT_PUBLIC_CHAIN_ID || 84532);

export function useDepositFlow(
  address: `0x${string}` | undefined,
): DepositFlowState {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const [amount, setAmountRaw] = useState("");
  const [step, setStep] = useState<DepositStep>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  let parsedAmount = 0n;
  try {
    parsedAmount = amount ? parseUnits(amount, 6) : 0n;
  } catch {
    parsedAmount = 0n;
  }

  // --- Reads ----------------------------------------------------------------

  const { data: usdcBalanceRaw, refetch: refetchUsdc } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  const { data: allowanceRaw, refetch: refetchAllowance } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: { enabled: !!address, refetchInterval: 10_000 },
  });

  // --- Writes ---------------------------------------------------------------

  const { writeContractAsync: execApprove, data: approveTxHash } = useWriteContract();
  const { writeContractAsync: execDeposit, data: depositTxHash } = useWriteContract();

  // --- Receipt tracking -----------------------------------------------------

  const { isSuccess: approveConfirmed, isError: approveReverted } =
    useWaitForTransactionReceipt({ hash: approveTxHash });

  const { isSuccess: depositConfirmed, isError: depositReverted } =
    useWaitForTransactionReceipt({ hash: depositTxHash });

  // --- State transitions ----------------------------------------------------

  // Approve confirmed → refresh allowance, back to idle for the deposit step
  useEffect(() => {
    if (approveConfirmed) {
      refetchAllowance();
      setStep("idle");
    }
  }, [approveConfirmed, refetchAllowance]);

  // Approve reverted on-chain
  useEffect(() => {
    if (approveReverted) {
      setStep("error");
      setErrorMessage("Approval transaction reverted on-chain.");
    }
  }, [approveReverted]);

  // Deposit confirmed → refresh wallet balance, transition to success
  useEffect(() => {
    if (depositConfirmed) {
      refetchUsdc();
      setStep("success");
      // Auto-reset after 5 s so user can make another deposit
      const t = setTimeout(() => {
        setStep("idle");
      }, 5_000);
      return () => clearTimeout(t);
    }
  }, [depositConfirmed, refetchUsdc]);

  // Deposit reverted on-chain
  useEffect(() => {
    if (depositReverted) {
      setStep("error");
      setErrorMessage("Deposit transaction reverted on-chain.");
    }
  }, [depositReverted]);

  // --- Derived --------------------------------------------------------------

  const usdcBalance = usdcBalanceRaw as bigint | undefined;
  const allowance = allowanceRaw as bigint | undefined;

  const needsApproval =
    allowance !== undefined && parsedAmount > 0n && parsedAmount > allowance;

  const isPending = step === "approving" || step === "depositing";

  const isCorrectNetwork = !address || chainId === EXPECTED_CHAIN_ID;

  const networkError: string | null = (() => {
    if (!address) return null;
    if (!isCorrectNetwork) {
      const name = EXPECTED_CHAIN_ID === 8453 ? "Base" : "Base Sepolia";
      return `Wrong network — switch to ${name} (chain ID: ${EXPECTED_CHAIN_ID}).`;
    }
    return null;
  })();

  const canSubmit =
    !isPending &&
    step !== "success" &&
    !!address &&
    isCorrectNetwork &&
    parsedAmount > 0n;

  // --- Validation -----------------------------------------------------------

  function validate(): string | null {
    if (!address) return "Connect your wallet first.";
    if (!isCorrectNetwork) {
      const name = EXPECTED_CHAIN_ID === 8453 ? "Base" : "Base Sepolia";
      return `Wrong network — switch to ${name} (chain ID: ${EXPECTED_CHAIN_ID}).`;
    }
    if (parsedAmount <= 0n) return "Enter an amount.";
    if (parsedAmount < parseUnits("10", 6)) return "Minimum deposit is 10 USDC.";
    if (usdcBalance !== undefined && usdcBalance < parsedAmount)
      return `Insufficient balance — you have ${formatUnits(usdcBalance, 6)} USDC.`;
    if (VAULT_ADDRESS === "0x0000000000000000000000000000000000000000")
      return "Vault not configured. Set NEXT_PUBLIC_VAULT_ADDRESS.";
    return null;
  }

  // --- Action ---------------------------------------------------------------

  async function handleAction() {
    // Prevent re-entry while a tx is in flight
    if (isPending || step === "success") return;

    setErrorMessage(null);

    const validationErr = validate();
    if (validationErr) {
      setErrorMessage(validationErr);
      setStep("error");
      return;
    }

    if (needsApproval) {
      setStep("approving");
      try {
        await execApprove({
          address: USDC_ADDRESS,
          abi: ERC20_ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, parsedAmount],
        });
        // step stays "approving" until approveConfirmed useEffect transitions it
      } catch (err) {
        setStep("error");
        setErrorMessage(
          err instanceof Error
            ? err.message.split("\n")[0]
            : "Approval rejected.",
        );
      }
    } else {
      setStep("depositing");
      try {
        await execDeposit({
          address: VAULT_ADDRESS,
          abi: VAULT_ABI,
          functionName: "deposit",
          args: [parsedAmount, address!],
        });
        // step stays "depositing" until depositConfirmed useEffect transitions it
      } catch (err) {
        setStep("error");
        setErrorMessage(
          err instanceof Error
            ? err.message.split("\n")[0]
            : "Deposit rejected.",
        );
      }
    }
  }

  // --- Helpers --------------------------------------------------------------

  function dismissError() {
    if (step === "error") {
      setStep("idle");
      setErrorMessage(null);
    }
  }

  function setAmount(v: string) {
    setAmountRaw(v);
    // Auto-clear error when user edits the amount
    if (step === "error") {
      setStep("idle");
      setErrorMessage(null);
    }
  }

  function switchNetwork() {
    switchChain({ chainId: EXPECTED_CHAIN_ID });
  }

  return {
    amount,
    setAmount,
    step,
    errorMessage,
    dismissError,
    usdcBalance,
    parsedAmount,
    needsApproval,
    isPending,
    canSubmit,
    isCorrectNetwork,
    networkError,
    handleAction,
    switchNetwork,
  };
}
