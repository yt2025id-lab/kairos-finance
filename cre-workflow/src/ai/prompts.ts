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

  // Dynamic weight adjustments based on time horizon and deposit size
  let apyWeight = 35;
  let safetyWeight = 30;
  let tvlWeight = 20;
  let stabilityWeight = 15;

  if (timeHorizonDays < 30) {
    safetyWeight += 10;
    apyWeight -= 10;
  } else if (timeHorizonDays > 90) {
    apyWeight += 10;
    safetyWeight -= 10;
  }

  const depositNum = parseFloat(depositAmount.replace(/,/g, ""));
  if (depositNum > 50000) {
    tvlWeight += 5;
    stabilityWeight -= 5;
  }

  return `You are an expert DeFi yield analyst for Base blockchain (L2).

TASK: Analyze all lending protocols and recommend the best one for a USDC deposit. Provide detailed scoring for each protocol.

USER PARAMETERS:
- Deposit amount: ${depositAmount} USDC
- Time horizon: ${timeHorizonDays} days
- Chain: Base (Ethereum L2)
- Risk tolerance: Conservative (capital preservation priority)

CURRENT PROTOCOL DATA (live on-chain data):

${protocolList}

SCORING FRAMEWORK:
Score each protocol on four dimensions (0-100 scale):

1. APY Score (weight: ${apyWeight}%): Current yield relative to peers. Highest APY = 100, others scaled proportionally.
2. Safety Score (weight: ${safetyWeight}%): Protocol maturity, audit history, track record.
   - Aave: ~90-95 (most battle-tested, $10B+ TVL across chains)
   - Compound: ~85-90 (established, proven governance)
   - Moonwell: ~70-80 (Base-native, growing, Moonbeam heritage)
   - Morpho: ~75-85 (innovative optimizer, newer but well-audited)
3. TVL Depth Score (weight: ${tvlWeight}%): Total value locked as indicator of liquidity and trust. Higher TVL = higher score.
4. Stability Score (weight: ${stabilityWeight}%): Rate consistency over time.
   - For short horizons (<30 days): current rate stability matters more
   - For long horizons (>90 days): historical rate trends matter more

Calculate weightedTotal = (apyScore * ${apyWeight} + safetyScore * ${safetyWeight} + tvlScore * ${tvlWeight} + stabilityScore * ${stabilityWeight}) / 100

RESPOND IN THIS EXACT JSON FORMAT:
{
  "protocolId": <0=Aave, 1=Morpho, 2=Compound, 3=Moonwell>,
  "allocationBps": 10000,
  "expectedAPY": <expected annualized APY as basis points, e.g. 350 for 3.5%>,
  "confidence": <0-100 integer, how confident you are in this recommendation>,
  "riskScore": <0-100 integer, overall risk assessment where 100 = safest>,
  "reasoning": "<2-3 sentence summary of why this protocol is the best choice>",
  "scores": [
    {
      "protocolId": 0,
      "name": "Aave V3",
      "apyScore": <0-100>,
      "safetyScore": <0-100>,
      "tvlScore": <0-100>,
      "stabilityScore": <0-100>,
      "weightedTotal": <calculated weighted score>
    },
    <repeat for all 4 protocols in order: Aave(0), Morpho(1), Compound(2), Moonwell(3)>
  ],
  "alternatives": [
    {
      "protocolId": <id of 2nd best>,
      "name": "<protocol name>",
      "expectedAPY": <APY in basis points>,
      "weightedScore": <their weightedTotal>,
      "reason": "<why not chosen over the recommended protocol>"
    },
    <repeat for 3rd and 4th best>
  ]
}

Return ONLY the JSON object, no additional text or markdown.`;
}
