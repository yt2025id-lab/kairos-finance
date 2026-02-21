import { parseAbi } from "viem";
import type { ProtocolAPYData } from "../ai/types.js";

const AAVE_DATA_PROVIDER = "0x2d8A3C5677189723C4cB8873CfC9C8976FDF38Ac" as const;
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913" as const;

const dataProviderAbi = parseAbi([
  "function getReserveData(address asset) external view returns (uint256 unbacked, uint256 accruedToTreasuryScaled, uint256 totalAToken, uint256 totalStableDebt, uint256 totalVariableDebt, uint256 liquidityRate, uint256 variableBorrowRate, uint256 stableBorrowRate, uint256 averageStableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 lastUpdateTimestamp)",
]);

const RAY = 10n ** 27n;

export async function getAaveAPY(client: any): Promise<ProtocolAPYData> {
  const data = await client.readContract({
    address: AAVE_DATA_PROVIDER,
    abi: dataProviderAbi,
    functionName: "getReserveData",
    args: [USDC_ADDRESS],
  });

  // liquidityRate is at index 5, in ray (1e27)
  const liquidityRate = data[5] as bigint;
  const apyPercent = Number(liquidityRate * 100n) / Number(RAY);

  const totalAToken = data[2] as bigint;
  const tvlFormatted = `$${(Number(totalAToken) / 1e6).toLocaleString()}`;

  return {
    name: "Aave V3",
    protocolId: 0,
    apy: apyPercent,
    tvl: tvlFormatted,
  };
}
