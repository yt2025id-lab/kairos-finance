import { parseAbi } from "viem";
import type { ProtocolAPYData } from "../ai/types.js";

const MOONWELL_MUSDC = "0xEdc817A28E8B93B03976FBd4a3dDBc9f7D176c22" as const;

const mTokenAbi = parseAbi([
  "function supplyRatePerTimestamp() external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function exchangeRateStored() external view returns (uint256)",
]);

const SECONDS_PER_YEAR = 365n * 24n * 60n * 60n;

export async function getMoonwellAPY(client: any): Promise<ProtocolAPYData> {
  const supplyRatePerTimestamp: bigint = await client.readContract({
    address: MOONWELL_MUSDC,
    abi: mTokenAbi,
    functionName: "supplyRatePerTimestamp",
  });

  const totalMTokenSupply: bigint = await client.readContract({
    address: MOONWELL_MUSDC,
    abi: mTokenAbi,
    functionName: "totalSupply",
  });

  const exchangeRate: bigint = await client.readContract({
    address: MOONWELL_MUSDC,
    abi: mTokenAbi,
    functionName: "exchangeRateStored",
  });

  // Rate is per second, scaled by 1e18
  const annualRate = supplyRatePerTimestamp * SECONDS_PER_YEAR;
  const apyPercent = Number(annualRate) / 1e18 * 100;

  // TVL = totalSupply * exchangeRate / 1e18 (result in USDC with 6 decimals)
  const tvlRaw = (totalMTokenSupply * exchangeRate) / (10n ** 18n);
  const tvlFormatted = `$${(Number(tvlRaw) / 1e6).toLocaleString()}`;

  return {
    name: "Moonwell",
    protocolId: 3,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
