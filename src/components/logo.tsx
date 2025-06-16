import { CandlestickChart } from 'lucide-react';
import type { SVGProps } from 'react';

// Using CandlestickChart as a base, can be replaced with a custom SVG or image
const ForexSageIcon = (props: SVGProps<SVGSVGElement>) => (
    <CandlestickChart {...props} />
);


export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <ForexSageIcon className="h-8 w-8 text-primary" />
      <span className="text-2xl font-bold text-primary">ForexSage</span>
    </div>
  );
}
