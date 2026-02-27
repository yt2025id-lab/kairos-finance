/**
 * Contract Integration Layer
 * Central exports for all contract-related functionality
 */

export { VAULT_ADDRESS, CONTROLLER_ADDRESS, USDC_ADDRESS, FAUCET_ADDRESS, validateContractAddresses } from "./addresses";
export { VAULT_ABI, ERC20_ABI, FAUCET_ABI, CONTROLLER_ABI } from "./abis";
export { createVaultContract, createERC20Contract, createControllerContract } from "./helpers";

export type { ContractConfig } from "./types";
