
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { InlineEditor } from '@/components/InlineEditor';

interface KeyValueRendererProps {
  label: string;
  value: any;
  onChange?: (value: any) => void;
}

export function KeyValueRenderer({ label, value, onChange }: KeyValueRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const displayValue = value?.toString() || '';

  const handleSave = (newValue: string) => {
    onChange?.(newValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-muted-foreground min-w-0 flex-shrink-0 mr-3">
        {label}:
      </span>
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <InlineEditor
            value={displayValue}
            onSave={handleSave}
            onCancel={handleCancel}
            className="h-7 text-sm"
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-7 px-2 justify-start text-left font-normal hover:bg-muted/50 w-full"
          >
            <span className="truncate">
              {displayValue || <em className="text-muted-foreground">Click to add...</em>}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}
