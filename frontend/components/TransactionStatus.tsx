/**
 * Transaction Status Component
 * Displays transaction pending, success, or error states
 */

import React from "react";
import { formatTxHash } from "@/lib/contracts/helpers";

interface TransactionStatusProps {
  status: "idle" | "pending" | "success" | "error";
  txHash?: `0x${string}`;
  error?: string;
  message?: string;
}

export function TransactionStatus({
  status,
  txHash,
  error,
  message,
}: TransactionStatusProps) {
  if (status === "idle") {
    return null;
  }

  const baseClass =
    "p-4 rounded-lg flex items-start gap-3 animate-in fade-in duration-200";

  if (status === "pending") {
    return (
      <div className={`${baseClass} bg-blue-50 border border-blue-200`}>
        <span className="inline-block w-4 h-4 mt-1 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <div className="flex-1">
          <p className="font-semibold text-blue-900">Processing Transaction</p>
          <p className="text-sm text-blue-700">
            {message || "Your transaction is being processed..."}
          </p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className={`${baseClass} bg-green-50 border border-green-200`}>
        <span className="text-lg text-green-600 font-bold">✓</span>
        <div className="flex-1">
          <p className="font-semibold text-green-900">Transaction Successful</p>
          {txHash && (
            <a
              href={`https://basescan.org/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:underline"
            >
              View on BaseScan: {formatTxHash(txHash)}
            </a>
          )}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={`${baseClass} bg-red-50 border border-red-200`}>
        <span className="text-lg text-red-600 font-bold">✕</span>
        <div className="flex-1">
          <p className="font-semibold text-red-900">Transaction Failed</p>
          {error && (
            <p className="text-sm text-red-700 mt-1 break-words">{error}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
}
