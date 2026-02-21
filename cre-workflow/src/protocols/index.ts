import type { ProtocolAPYData } from "../ai/types.js";
import { getAaveAPY } from "./aave.js";
import { getCompoundAPY } from "./compound.js";
import { getMoonwellAPY } from "./moonwell.js";
import { getMorphoAPY } from "./morpho.js";

export async function fetchAllProtocolAPYs(
  // Use `any` to accept chain-specific PublicClient variants (e.g. Base OP-stack)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any
): Promise<ProtocolAPYData[]> {
  // Fetch all protocol data in parallel
  const results = await Promise.allSettled([
    getAaveAPY(client),
    getMorphoAPY(), // HTTP-based, no client needed
    getCompoundAPY(client),
    getMoonwellAPY(client),
  ]);

  const protocols: ProtocolAPYData[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      protocols.push(result.value);
    } else {
      console.warn(`Failed to fetch protocol data: ${result.reason}`);
    }
  }

  return protocols;
}

export { getAaveAPY, getCompoundAPY, getMoonwellAPY, getMorphoAPY };
