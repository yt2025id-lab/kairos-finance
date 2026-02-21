import type { ProtocolAPYData } from "./types.js";

export function buildYieldAnalysisPrompt(
  protocols: ProtocolAPYData[],
  timeHorizonSeconds: number,
  depositAmount: string
): string {
  const timeHorizonDays = Math.round(timeHorizonSeconds / 86400);

  const protocolList = protocols
    .map(
      (p, i) =>
        `${i + 1}. ${p.name}:
   - Current Supply APY: ${p.apy.toFixed(2)}%
   - TVL: ${p.tvl}
   - Protocol ID: ${p.protocolId}`
    )
    .join("\n\n");

  return `You are an expert DeFi yield analyst for Base blockchain (L2).

TASK: Recommend the single best lending protocol for a USDC deposit.

USER PARAMETERS:
- Deposit amount: ${depositAmount} USDC
- Time horizon: ${timeHorizonDays} days
- Chain: Base (Ethereum L2)
- Risk tolerance: Conservative (capital preservation priority)

CURRENT PROTOCOL DATA (live on-chain data):

${protocolList}

ANALYSIS FACTORS:
- Higher APY is preferred, but stability over the time horizon matters more
- For short horizons (< 30 days): prioritize current rate stability and protocol safety
- For medium horizons (30-90 days): balance APY vs protocol risk
- For long horizons (> 90 days): prioritize protocol safety, TVL depth, and track record
- Larger deposits should favor higher-TVL protocols for better liquidity
- Consider protocol maturity: Aave (most battle-tested), Compound (established), Moonwell (Base-native, growing), Morpho (innovative, peer-to-peer optimized)
- Base L2 gas costs are low, so gas efficiency is less of a concern

RESPOND IN THIS EXACT JSON FORMAT:
{
  "protocolId": <0=Aave, 1=Morpho, 2=Compound, 3=Moonwell>,
  "allocationBps": 10000,
  "expectedAPY": <expected annualized APY as basis points, e.g. 350 for 3.5%>,
  "confidence": <"high"|"medium"|"low">,
  "reasoning": "<2-3 sentence explanation of why this protocol is best for the given parameters>"
}

Return ONLY the JSON object, no additional text or markdown.`;
}
