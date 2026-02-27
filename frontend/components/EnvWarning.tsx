/**
 * Environment Variables Warning Component
 * Shows warning in development if critical env vars are missing
 */

import React, { useState } from "react";
import { isEnvConfigured, validateEnv } from "@/lib/env";

interface EnvWarningProps {
  children: React.ReactNode;
}

export function EnvWarning({ children }: EnvWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const isConfigured = isEnvConfigured();
  const isDev = process.env.NODE_ENV === "development";

  if (isConfigured || !isDev || isDismissed) {
    return <>{children}</>;
  }

  const env = validateEnv();
  const errors: string[] = [];

  if (!process.env.NEXT_PUBLIC_VAULT_ADDRESS) {
    errors.push("NEXT_PUBLIC_VAULT_ADDRESS");
  }
  if (!process.env.NEXT_PUBLIC_CONTROLLER_ADDRESS) {
    errors.push("NEXT_PUBLIC_CONTROLLER_ADDRESS");
  }
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    errors.push("NEXT_PUBLIC_PRIVY_APP_ID");
  }

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-yellow-900 mb-2">
              Missing Environment Variables
            </h3>
            <p className="text-sm text-yellow-800 mb-3">
              The following required variables are not configured in your{" "}
              <code className="bg-yellow-100 px-2 py-1 rounded text-xs font-mono">
                .env.local
              </code>
              :
            </p>
            <ul className="text-sm text-yellow-800 space-y-1 mb-3">
              {errors.map((error) => (
                <li key={error} className="flex items-center gap-2">
                  <span className="text-yellow-600">•</span>
                  <code className="bg-yellow-100 px-2 py-1 rounded text-xs font-mono">
                    {error}
                  </code>
                </li>
              ))}
            </ul>
            <p className="text-xs text-yellow-700">
              Copy <code className="bg-yellow-100 px-2 py-1 rounded text-xs font-mono">.env.example</code> to{" "}
              <code className="bg-yellow-100 px-2 py-1 rounded text-xs font-mono">.env.local</code> and fill in the values.
            </p>
          </div>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-yellow-600 hover:text-yellow-800 font-bold text-xl leading-none"
          >
            ✕
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}
