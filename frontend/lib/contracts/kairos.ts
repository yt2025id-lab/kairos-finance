/**
 * Kairos Finance — contract integration entry point
 *
 * Import from here for a single, stable public API:
 *   import { kairos } from "@/lib/contracts/kairos"
 *
 * Or use the named exports directly when tree-shaking matters.
 */

export {
  VAULT_ADDRESS,
  CONTROLLER_ADDRESS,
  USDC_ADDRESS,
  FAUCET_ADDRESS,
  validateContractAddresses,
} from "./addresses";

export {
  VAULT_ABI,
  ERC20_ABI,
  FAUCET_ABI,
  CONTROLLER_ABI,
} from "./abis";

export {
  createVaultContract,
  createERC20Contract,
  createControllerContract,
  formatUSDC,
  parseUSDC,
  formatTxHash,
} from "./helpers";

export type {
  ContractConfig,
  UserPosition,
  StrategyRecommendation,
  TxState,
  UseContractAction,
} from "./types";

// ---------------------------------------------------------------------------
// Convenience namespace — useful when you want a single import handle
// ---------------------------------------------------------------------------
import {
  VAULT_ADDRESS,
  CONTROLLER_ADDRESS,
  USDC_ADDRESS,
  FAUCET_ADDRESS,
} from "./addresses";
import { VAULT_ABI, ERC20_ABI, FAUCET_ABI, CONTROLLER_ABI } from "./abis";
import {
  createVaultContract,
  createERC20Contract,
  createControllerContract,
  formatUSDC,
  parseUSDC,
  formatTxHash,
} from "./helpers";

export const kairos = {
  addresses: {
    vault: VAULT_ADDRESS,
    controller: CONTROLLER_ADDRESS,
    usdc: USDC_ADDRESS,
    faucet: FAUCET_ADDRESS,
  },
  abis: {
    vault: VAULT_ABI,
    erc20: ERC20_ABI,
    faucet: FAUCET_ABI,
    controller: CONTROLLER_ABI,
  },
  contracts: {
    vault: createVaultContract,
    erc20: createERC20Contract,
    controller: createControllerContract,
  },
  format: {
    usdc: formatUSDC,
    txHash: formatTxHash,
  },
  parse: {
    usdc: parseUSDC,
  },
} as const;
