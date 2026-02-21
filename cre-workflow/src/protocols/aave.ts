/**
 * Aave V3 APY Reader — uses CRE EVMClient for on-chain reads
 */

import {
  bytesToHex,
  encodeCallMsg,
  LAST_FINALIZED_BLOCK_NUMBER,
  type Runtime,
} from "@chainlink/cre-sdk";
import {
  encodeFunctionData,
  decodeFunctionResult,
  parseAbi,
  zeroAddress,
  type Address,
} from "viem";
import type { ProtocolAPYData } from "../ai/types.js";

// Aave V3 PoolDataProvider on Base mainnet
const AAVE_DATA_PROVIDER = "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac" as const;
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

const dataProviderAbi = parseAbi([
  "function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)",
]);

const RAY = 10n ** 27n;

type EVMClientLike = {
  callContract: (runtime: Runtime<any>, input: any) => { result: () => { data: Uint8Array } };
};

/**
 * Read Aave V3 supply APY via CRE EVMClient.callContract
 */
export function readAaveAPY(evmClient: EVMClientLike, runtime: Runtime<any>): ProtocolAPYData {
  const callData = encodeFunctionData({
    abi: dataProviderAbi,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
  });

  const result = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: AAVE_DATA_PROVIDER as Address,
      data: callData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const decoded = decodeFunctionResult({
    abi: dataProviderAbi,
    functionName: "getReserveData",
    data: bytesToHex(result.data),
  }) as readonly bigint[];

  // liquidityRate is at index 5, in ray (1e27)
  const liquidityRate = decoded[5];
  const apyPercent = Number(liquidityRate * 100n) / Number(RAY);

  // totalAToken is at index 2 (USDC has 6 decimals)
  const totalAToken = decoded[2];
  const tvlFormatted = `$${(Number(totalAToken) / 1e6).toLocaleString()}`;

  return {
    name: "Aave V3",
    protocolId: 0,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
