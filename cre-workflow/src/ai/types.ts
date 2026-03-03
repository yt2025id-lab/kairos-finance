import { z } from "zod";

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

// Zod schema for runtime validation of Claude AI responses
export const AIRecommendationSchema = z.object({
  protocolId: z.number().int().min(0).max(3),
  allocationBps: z.number().int().min(1).max(10000),
  expectedAPY: z.number().int().nonnegative(),
  confidence: z.enum(["high", "medium", "low"]),
  reasoning: z.string().min(1).max(2000),
});

export interface StrategyRequestEvent {
  user: `0x${string}`;
  amount: bigint;
  timeHorizon: bigint;
  timestamp: bigint;
}
