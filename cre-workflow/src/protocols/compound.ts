/**
 * Compound V3 (Comet) APY Reader — uses CRE EVMClient for on-chain reads
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

// Compound V3 Comet USDC on Base mainnet
const COMET_USDC = "0xb125E6687d4313864e53df431d5425969c15Eb2F" as const;

const cometAbi = parseAbi([
  "function getSupplyRate(uint256 utilization) external view returns (uint64)",
  "function getUtilization() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
]);

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

type EVMClientLike = {
  callContract: (runtime: Runtime<any>, input: any) => { result: () => { data: Uint8Array } };
};

/**
 * Read Compound V3 supply APY via CRE EVMClient.callContract
 */
export function readCompoundAPY(evmClient: EVMClientLike, runtime: Runtime<any>): ProtocolAPYData {
  // Step 1: Get utilization
  const utilCallData = encodeFunctionData({
    abi: cometAbi,
    functionName: "getUtilization",
  });

  const utilResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: COMET_USDC as Address,
      data: utilCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const utilization = decodeFunctionResult({
    abi: cometAbi,
    functionName: "getUtilization",
    data: bytesToHex(utilResult.data),
  }) as bigint;

  // Step 2: Get supply rate per second
  const rateCallData = encodeFunctionData({
    abi: cometAbi,
    functionName: "getSupplyRate",
    args: [utilization],
  });

  const rateResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: COMET_USDC as Address,
      data: rateCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const supplyRatePerSecond = decodeFunctionResult({
    abi: cometAbi,
    functionName: "getSupplyRate",
    data: bytesToHex(rateResult.data),
  }) as bigint;

  // Step 3: Get total supply (TVL)
  const supplyCallData = encodeFunctionData({
    abi: cometAbi,
    functionName: "totalSupply",
  });

  const supplyResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: COMET_USDC as Address,
      data: supplyCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const totalSupply = decodeFunctionResult({
    abi: cometAbi,
    functionName: "totalSupply",
    data: bytesToHex(supplyResult.data),
  }) as bigint;

  // Supply rate is per second, scaled by 1e18
  const annualRate = BigInt(supplyRatePerSecond) * SECONDS_PER_YEAR;
  const apyPercent = (Number(annualRate) / 1e18) * 100;

  const tvlFormatted = `$${(Number(totalSupply) / 1e6).toLocaleString()}`;

  return {
    name: "Compound V3",
    protocolId: 2,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
