/**
 * Morpho APY Reader — uses CRE HTTPClient for GraphQL API
 *
 * Morpho does not expose a simple on-chain APY view function.
 * We query the Morpho Blue public GraphQL API for USDC market data on Base.
 * This must be called inside runInNodeMode since it uses HTTPClient.
 */

import { cre, type NodeRuntime } from "@chainlink/cre-sdk";
import type { ProtocolAPYData } from "../ai/types.js";

const MORPHO_GRAPHQL_URL = "https://blue-api.morpho.org/graphql";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

interface MorphoMarketData {
  items: Array<{
    state: {
      supplyApy: number;
      totalSupplyAssets: number;
    };
  }>;
}

interface MorphoGraphQLResponse {
  data: {
    markets: MorphoMarketData;
  };
}

/**
 * Read Morpho APY via HTTPClient (must be called inside runInNodeMode)
 */
export function readMorphoAPY(nodeRuntime: NodeRuntime<any>): ProtocolAPYData {
  const query = `{
    markets(
      where: {
        chainId_in: [8453]
        loanAssetAddress_in: ["${USDC_ADDRESS}"]
      }
      orderBy: TotalSupplyAssetsUsd
      first: 5
    ) {
      items {
        state {
          supplyApy
          totalSupplyAssets
        }
      }
    }
  }`;

  const httpClient = new cre.capabilities.HTTPClient();

  const response = httpClient.sendRequest(nodeRuntime, {
    url: MORPHO_GRAPHQL_URL,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: btoa(JSON.stringify({ query })),
  }).result();

  if (response.statusCode !== 200) {
    // Fallback if Morpho API is unavailable
    return { name: "Morpho", protocolId: 1, apy: 0, tvl: "N/A" };
  }

  const data: MorphoGraphQLResponse = JSON.parse(
    new TextDecoder().decode(response.body)
  );
  const markets = data.data.markets.items;

  if (markets.length === 0) {
    return { name: "Morpho", protocolId: 1, apy: 0, tvl: "N/A" };
  }

  // Aggregate: use the best APY market and sum TVL
  let bestApy = 0;
  let totalTvl = 0;

  for (const market of markets) {
    const apy = market.state.supplyApy * 100; // Convert to percentage
    if (apy > bestApy) bestApy = apy;
    totalTvl += market.state.totalSupplyAssets;
  }

  const tvlFormatted = `$${(totalTvl / 1e6).toLocaleString()}`;

  return {
    name: "Morpho",
    protocolId: 1,
    apy: bestApy,
    tvl: tvlFormatted,
  };
}
