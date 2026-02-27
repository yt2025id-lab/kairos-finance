/**
 * Web3 Hooks Export
 * Centralized exports for all contract interaction hooks
 */

export { useDeposit } from "./useDeposit";
export { useWithdraw } from "./useWithdraw";
export { useRequestStrategy } from "./useRequestStrategy";
export {
  useVaultBalance,
  useTotalVaultAssets,
  useHasActiveRequest,
} from "./useVaultBalance";
export { useActiveWallet } from "./useActiveWallet";

export type { RequestStrategyResult, RequestStrategyArgs } from "./useRequestStrategy";
export type { DepositArgs } from "./useDeposit";
export type { WithdrawArgs } from "./useWithdraw";
export type { VaultBalance } from "./useVaultBalance";
