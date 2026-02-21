export interface ProtocolAPYData {
  name: string;
  protocolId: number;
  apy: number;
  tvl: string;
}

export interface AIRecommendation {
  protocolId: number;
  allocationBps: number;
  expectedAPY: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface StrategyRequestEvent {
  user: `0x${string}`;
  amount: bigint;
  timeHorizon: bigint;
  timestamp: bigint;
}
