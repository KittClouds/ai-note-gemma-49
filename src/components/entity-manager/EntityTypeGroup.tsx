
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { EntityCard } from './EntityCard';
import { Entity } from '@/utils/parsingUtils';

interface EntityTypeGroupProps {
  kind: string;
  entities: Entity[];
}

export function EntityTypeGroup({ kind, entities }: EntityTypeGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card>
      <CardContent className="p-0">
        <Button
          variant="ghost"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex items-center justify-between hover:bg-accent rounded-none"
        >
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-primary" />
            <span className="font-medium">{kind}</span>
            <Badge variant="secondary" className="text-xs">
              {entities.length}
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {isExpanded && (
          <div className="p-4 pt-0 space-y-2">
            {entities.map((entity, index) => (
              <EntityCard
                key={`${entity.kind}-${entity.label}-${index}`}
                entity={entity}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
