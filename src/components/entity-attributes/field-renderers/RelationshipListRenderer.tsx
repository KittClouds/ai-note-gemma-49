
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';
import * as Icons from 'lucide-react';

interface Relationship {
  name: string;
  type?: string;
}

interface RelationshipListRendererProps {
  label: string;
  relationships: Relationship[] | any;
  icon?: string;
  onChange?: (relationships: Relationship[]) => void;
}

export function RelationshipListRenderer({ 
  label, 
  relationships, 
  icon,
  onChange 
}: RelationshipListRendererProps) {
  // Ensure relationships is always an array
  const relationshipArray = React.useMemo(() => {
    if (!relationships) return [];
    if (Array.isArray(relationships)) return relationships;
    if (typeof relationships === 'string') return [{ name: relationships }];
    if (typeof relationships === 'object' && relationships.name) return [relationships];
    return [];
  }, [relationships]);

  const [newRelationship, setNewRelationship] = useState('');
  
  const IconComponent = icon ? Icons[icon as keyof typeof Icons] as React.ComponentType<{ className?: string }> : null;

  const addRelationship = () => {
    if (newRelationship.trim()) {
      const updatedRelationships = [...relationshipArray, { name: newRelationship.trim() }];
      onChange?.(updatedRelationships);
      setNewRelationship('');
    }
  };

  const removeRelationship = (index: number) => {
    const updatedRelationships = relationshipArray.filter((_, i) => i !== index);
    onChange?.(updatedRelationships);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {IconComponent && <IconComponent className="h-3 w-3" />}
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Add relation..."
            value={newRelationship}
            onChange={(e) => setNewRelationship(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addRelationship()}
            className="h-7 text-xs w-28"
          />
          <Button size="sm" variant="ghost" onClick={addRelationship} className="h-7 w-7 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        {relationshipArray.map((relationship, index) => (
          <div key={index} className="flex items-center justify-between p-2 bg-muted/30 rounded text-xs">
            <span>{relationship.name}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeRelationship(index)}
              className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-2 w-2" />
            </Button>
          </div>
        ))}
        {relationshipArray.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No relationships</span>
        )}
      </div>
    </div>
  );
}
