export interface ProtocolAPYData {
  name: string;
  protocolId: number;
  apy: number; // percentage, e.g. 3.5 for 3.5%
  tvl: string; // formatted string
}

export interface AIRecommendation {
  protocolId: number;
  allocationBps: number;
  expectedAPY: number; // basis points, e.g. 350 for 3.5%
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface ClaudeAPIResponse {
  content: Array<{
    type: string;
    text: string;
  }>;
}

export interface StrategyRequestEvent {
  user: `0x${string}`;
  amount: bigint;
  timeHorizon: bigint;
  timestamp: bigint;
}
