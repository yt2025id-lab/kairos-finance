/**
 * Moonwell APY Reader — uses CRE EVMClient for on-chain reads
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

// Moonwell mUSDC on Base mainnet
const MOONWELL_MUSDC = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22" as const;

const mTokenAbi = parseAbi([
  "function supplyRatePerTimestamp() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function exchangeRateStored() external view returns (uint256)",
]);

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

type EVMClientLike = {
  callContract: (runtime: Runtime<any>, input: any) => { result: () => { data: Uint8Array } };
};

/**
 * Read Moonwell supply APY via CRE EVMClient.callContract
 */
export function readMoonwellAPY(evmClient: EVMClientLike, runtime: Runtime<any>): ProtocolAPYData {
  // Step 1: Get supply rate per timestamp (per second)
  const rateCallData = encodeFunctionData({
    abi: mTokenAbi,
    functionName: "supplyRatePerTimestamp",
  });

  const rateResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: MOONWELL_MUSDC as Address,
      data: rateCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const supplyRatePerTimestamp = decodeFunctionResult({
    abi: mTokenAbi,
    functionName: "supplyRatePerTimestamp",
    data: bytesToHex(rateResult.data),
  }) as bigint;

  // Step 2: Get total supply (mToken units)
  const supplyCallData = encodeFunctionData({
    abi: mTokenAbi,
    functionName: "totalSupply",
  });

  const supplyResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: MOONWELL_MUSDC as Address,
      data: supplyCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const totalMTokenSupply = decodeFunctionResult({
    abi: mTokenAbi,
    functionName: "totalSupply",
    data: bytesToHex(supplyResult.data),
  }) as bigint;

  // Step 3: Get exchange rate
  const exchangeCallData = encodeFunctionData({
    abi: mTokenAbi,
    functionName: "exchangeRateStored",
  });

  const exchangeResult = evmClient.callContract(runtime, {
    call: encodeCallMsg({
      from: zeroAddress,
      to: MOONWELL_MUSDC as Address,
      data: exchangeCallData,
    }),
    blockNumber: LAST_FINALIZED_BLOCK_NUMBER,
  }).result();

  const exchangeRate = decodeFunctionResult({
    abi: mTokenAbi,
    functionName: "exchangeRateStored",
    data: bytesToHex(exchangeResult.data),
  }) as bigint;

  // Rate is per second, scaled by 1e18
  const annualRate = supplyRatePerTimestamp * SECONDS_PER_YEAR;
  const apyPercent = (Number(annualRate) / 1e18) * 100;

  // TVL = totalSupply * exchangeRate / 1e18 (result in USDC with 6 decimals)
  const tvlRaw = (totalMTokenSupply * exchangeRate) / 10n ** 18n;
  const tvlFormatted = `$${(Number(tvlRaw) / 1e6).toLocaleString()}`;

  return {
    name: "Moonwell",
    protocolId: 3,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
