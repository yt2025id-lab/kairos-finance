/**
 * Transaction Button Component
 * Prevents multiple clicks during pending transaction
 * Shows loading state and disabled during execution
 */

import React from "react";

interface TransactionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isPending: boolean;
  isSuccess?: boolean;
  error?: string | null;
  txHash?: `0x${string}`;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function TransactionButton({
  isPending,
  isSuccess,
  error,
  txHash,
  children,
  disabled,
  className,
  onClick,
  ...props
}: TransactionButtonProps) {
  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent multiple clicks
    if (isPending) {
      e.preventDefault();
      return;
    }

    if (onClick) {
      await onClick(e);
    }
  };

  const baseClass =
    "relative px-4 py-2 rounded-lg font-semibold transition-all duration-200";

  let buttonClass = baseClass;

  if (isPending) {
    buttonClass +=
      " bg-blue-500 text-white opacity-75 cursor-not-allowed disabled";
  } else if (isSuccess) {
    buttonClass += " bg-green-500 text-white";
  } else if (error) {
    buttonClass += " bg-red-500 text-white";
  } else {
    buttonClass +=
      " bg-blue-600 text-white hover:bg-blue-700 active:scale-95";
  }

  if (className) {
    buttonClass = `${className} ${buttonClass}`;
  }

  return (
    <button
      {...props}
      disabled={disabled || isPending}
      onClick={handleClick}
      className={buttonClass}
    >
      <div className="flex items-center justify-center gap-2">
        {isPending && (
          <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
        )}
        {isSuccess && (
          <span className="text-lg">✓</span>
        )}
        {error && (
          <span className="text-lg">✕</span>
        )}
        <span>{children}</span>
      </div>
    </button>
  );
}
