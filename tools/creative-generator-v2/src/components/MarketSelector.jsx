import { ChevronDown } from 'lucide-react';
import { MARKETS } from '../config';

export default function MarketSelector({ selected, onChange }) {
  return (
    <div className="relative">
      <select
        value={selected}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-surface-raised border border-border rounded-lg px-3 py-2 pr-8 text-sm text-white focus:outline-none focus:border-accent cursor-pointer"
      >
        {MARKETS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.flag} {m.name}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
    </div>
  );
}
