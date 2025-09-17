
import React from 'react';
import { StatBlockValue } from '@/types/attributes';

interface StatBlockRendererProps {
  value: StatBlockValue;
}

export function StatBlockRenderer({ value }: StatBlockRendererProps) {
  // Handle flexible StatBlockValue format
  const stats = Object.entries(value);
  
  if (stats.length === 0) {
    return (
      <div className="text-xs text-muted-foreground italic">
        No stats defined
      </div>
    );
  }

  const values = stats.map(([_, val]) => val);
  const highestStat = Math.max(...values);

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map(([stat, val]) => (
        <div key={stat} className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground capitalize">
            {stat.length > 8 ? stat.slice(0, 8) + '...' : stat}
          </span>
          <span className={`text-sm font-medium ${
            val === highestStat ? 'font-bold text-primary' : 'text-white'
          }`}>
            {val}
          </span>
        </div>
      ))}
    </div>
  );
}
