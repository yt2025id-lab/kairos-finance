/**
 * TypeScript types for contracts
 */

export interface ContractConfig {
  address: `0x${string}`;
  abi: readonly unknown[];
  chainId: number;
}

/**
 * User position in vault
 */
export interface UserPosition {
  depositAmount: bigint;
  timeHorizon: bigint;
  depositTimestamp: bigint;
  activeStrategy: `0x${string}`;
  allocatedAmount: bigint;
  isActive: boolean;
}

/**
 * Strategy recommendation from AI
 */
export interface StrategyRecommendation {
  user: `0x${string}`;
  protocol: number;
  allocationBps: bigint;
  expectedAPY: bigint;
  reasoning: string;
}

/**
 * Transaction state during contract calls
 */
export interface TxState {
  status: "idle" | "pending" | "success" | "error";
  hash?: `0x${string}`;
  error?: string;
  blockConfirmations?: number;
}

/**
 * Hook return type for contract operations
 */
export interface UseContractAction<T = unknown, Args = unknown> {
  data?: T;
  error: Error | null;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  txState: TxState;
  execute: (args?: Args) => Promise<void>;
}
