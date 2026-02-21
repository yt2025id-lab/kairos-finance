import { encodeAbiParameters, parseAbiParameters, decodeAbiParameters } from "viem";

/**
 * Encode AI recommendation for on-chain delivery to KairosController
 */
export function encodeRecommendation(
  user: `0x${string}`,
  protocolId: number,
  allocationBps: number,
  expectedAPY: number,
  reasoning: string
): `0x${string}` {
  return encodeAbiParameters(
    parseAbiParameters("address, uint8, uint256, uint256, string"),
    [user, protocolId, BigInt(allocationBps), BigInt(expectedAPY), reasoning]
  );
}

/**
 * Format bigint USDC amount to human-readable string
 */
export function formatUSDC(amount: bigint): string {
  const whole = amount / 1_000_000n;
  const fraction = amount % 1_000_000n;
  if (fraction === 0n) return whole.toString();
  return `${whole}.${fraction.toString().padStart(6, "0").replace(/0+$/, "")}`;
}
