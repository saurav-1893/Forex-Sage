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
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent" />
            Real-Time Data: <Skeleton className="h-6 w-24" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Price:</span>
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Bid:</span>
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ask:</span>
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Timestamp:</span>
            <Skeleton className="h-5 w-32" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || !pairSymbol) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-6 w-6 text-accent" />
            Real-Time Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Select a Forex pair to view real-time data.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Activity className="h-6 w-6 text-accent" />
          Real-Time Data: {pairSymbol.toUpperCase()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between animate-pulse-once">
          <span className="text-muted-foreground flex items-center"><DollarSign className="h-4 w-4 mr-1" />Price:</span>
          <span className="font-semibold text-lg text-accent">{data.price.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center"><TrendingUp className="h-4 w-4 mr-1" />Bid:</span>
          <span className="font-medium">{data.bid.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground flex items-center"><TrendingUp className="h-4 w-4 mr-1 rotate-180" />Ask:</span>
          <span className="font-medium">{data.ask.toFixed(5)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t mt-2">
          <span className="text-muted-foreground flex items-center"><Clock className="h-4 w-4 mr-1" />Timestamp:</span>
          <span className="text-sm">{new Date(data.timestamp).toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
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
