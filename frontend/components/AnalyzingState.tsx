/**
 * AI Analyzing State Component
 * Shows when Chainlink CRE is analyzing strategy recommendation
 */

import React from "react";

interface AnalyzingStateProps {
  isAnalyzing: boolean;
  message?: string;
}

export function AnalyzingState({
  isAnalyzing,
  message = "🤖 AI is analyzing your investment profile...",
}: AnalyzingStateProps) {
  if (!isAnalyzing) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center gap-4">
          {/* Animated dots */}
          <div className="flex gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100" />
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-200" />
          </div>

          <p className="text-center text-gray-700 font-semibold text-lg">
            {message}
          </p>

          <p className="text-center text-gray-500 text-sm">
            This may take a few moments while our AI analyzes your investment profile and market conditions.
          </p>
        </div>
      </div>
    </div>
  );
}
