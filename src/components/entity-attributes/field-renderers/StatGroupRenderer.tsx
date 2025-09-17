
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { StatBlockValue } from '@/types/attributes';

interface StatGroupRendererProps {
  label: string;
  stats: StatBlockValue | any;
  onChange?: (stats: StatBlockValue) => void;
}

export function StatGroupRenderer({ label, stats }: StatGroupRendererProps) {
  // Handle different stat formats
  const renderStats = (): React.ReactNode => {
    if (!stats) {
      return <p className="text-xs text-muted-foreground italic">No stats defined</p>;
    }

    // Handle ProgressBar format (current/maximum)
    if (typeof stats === 'object' && stats.current !== undefined && stats.maximum !== undefined) {
      const percentage = (stats.current / stats.maximum) * 100;
      return (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span>{stats.current}</span>
            <span className="text-muted-foreground">/ {stats.maximum}</span>
          </div>
          <Progress value={percentage} className="h-2" />
        </div>
      );
    }

    // Handle StatBlock format (flexible object with string keys and number values)
    if (typeof stats === 'object' && stats !== null) {
      const statEntries = Object.entries(stats).filter(([_, value]) => typeof value === 'number');
      
      if (statEntries.length === 0) {
        return <p className="text-xs text-muted-foreground italic">No valid stats found</p>;
      }

      const values = statEntries.map(([_, value]) => value as number);
      const highestStat = Math.max(...values);

      return (
        <div className="grid grid-cols-2 gap-2">
          {statEntries.map(([statName, value]) => (
            <div key={statName} className="flex justify-between text-xs">
              <span className="capitalize text-muted-foreground">{statName}:</span>
              <span className={`font-medium ${
                (value as number) === highestStat ? 'font-bold text-primary' : 'text-foreground'
              }`}>
                {value as number}
              </span>
            </div>
          ))}
        </div>
      );
    }

    // Handle fallback case - convert to string and wrap in JSX
    return <span className="text-xs">{String(stats)}</span>;
  };

  return (
    <div className="space-y-2">
      <span className="text-sm text-muted-foreground">{label}:</span>
      <div className="pl-2">
        {renderStats()}
      </div>
    </div>
  );
}
