import type { ForexData } from "@/services/forex-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Clock, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ForexDataCardProps {
  data: ForexData | null;
  pairSymbol: string | null;
  isLoading: boolean;
}

export function ForexDataCard({ data, pairSymbol, isLoading }: ForexDataCardProps) {
  // Safe number formatting helper
  const formatNumber = (value: number | undefined | null) => {
    return typeof value === 'number' ? value.toFixed(4) : '0.0000';
  };

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          {pairSymbol || 'Select Pair'}
        </h3>
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-1/2 bg-muted rounded"></div>
          </div>
        ) : data ? (
          <div className="mt-4 grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Bid</p>
                <p className="text-2xl font-bold">{formatNumber(data.bid)}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Ask</p>
                <p className="text-2xl font-bold">{formatNumber(data.ask)}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mt-2">
            Select a forex pair to view current prices
          </p>
        )}
      </div>
    </div>
  );
}

// Simple one-time pulse animation
const pulseOnceKeyframes = `
  @keyframes pulseOnce {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.02); }
  }
`;
const pulseOnceAnimation = 'pulseOnce 0.7s ease-in-out';

if (typeof window !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = pulseOnceKeyframes;
  document.head.appendChild(styleSheet);
}

// Add to your global CSS or component-specific style if preferred
// .animate-pulse-once { animation: pulseOnce 0.7s ease-in-out; }
// @keyframes pulseOnce {
//   0%, 100% { opacity: 1; transform: scale(1); }
//   50% { opacity: 0.7; transform: scale(1.02); }
// }
// For simplicity, this is handled inline here.
// A better approach for more complex animations is a dedicated CSS file.
// Here, we inject the keyframes dynamically.
// To make this work with Tailwind JIT, we'd need to safelist `animate-pulse-once`
// or define it in tailwind.config.js if it's a custom animation.
// The current implementation dynamically creates a style tag which is generally fine for small, specific animations.
// Using `className="[...] animate-pulse-once"` where `animate-pulse-once` is defined in `tailwind.config.js`
// `animation: { 'pulse-once': 'pulseOnce 0.7s ease-in-out' }`
// `keyframes: { pulseOnce: { '0%, 100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.7, transform: 'scale(1.02)' } } }`
// This is a workaround for now for quick effect.
const priceElement = typeof document !== 'undefined' ? document.querySelector('.animate-pulse-once') : null;
if (priceElement) {
  (priceElement as HTMLElement).style.animation = pulseOnceAnimation;
}
