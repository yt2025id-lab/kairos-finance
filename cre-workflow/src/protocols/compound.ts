import { parseAbi } from "viem";
import type { ProtocolAPYData } from "../ai/types.js";

const COMET_USDC = "0xb125E6687d4313864e53df431d5425969c15Eb2F" as const;

const cometAbi = parseAbi([
  "function getSupplyRate(uint256 utilization) external view returns (uint64)",
  "function getUtilization() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
]);

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

export async function getCompoundAPY(client: any): Promise<ProtocolAPYData> {
  const utilization = await client.readContract({
    address: COMET_USDC,
    abi: cometAbi,
    functionName: "getUtilization",
  });

  const supplyRatePerSecond = await client.readContract({
    address: COMET_USDC,
    abi: cometAbi,
    functionName: "getSupplyRate",
    args: [utilization],
  });

  const totalSupply = await client.readContract({
    address: COMET_USDC,
    abi: cometAbi,
    functionName: "totalSupply",
  });

  // Supply rate is per second, scaled by 1e18
  const annualRate = BigInt(supplyRatePerSecond) * SECONDS_PER_YEAR;
  const apyPercent = Number(annualRate) / 1e18 * 100;

  const tvlFormatted = `$${(Number(totalSupply) / 1e6).toLocaleString()}`;

  return {
    name: "Compound V3",
    protocolId: 2,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
