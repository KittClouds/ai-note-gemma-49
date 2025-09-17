
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Edit3 } from 'lucide-react';

interface LongTextRendererProps {
  label: string;
  text: string;
  onChange?: (text: string) => void;
}

export function LongTextRenderer({ label, text, onChange }: LongTextRendererProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(text || '');

  const handleSave = () => {
    onChange?.(editText);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(text || '');
    setIsEditing(false);
  };

  const displayText = text?.trim() || '';
  const isLong = displayText.length > 100;
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = isLong && !isExpanded && !isEditing;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}:</span>
        {!isEditing && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="h-6 w-6 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <Textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Enter description..."
            className="text-sm resize-none"
            rows={4}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} className="h-6 text-xs">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} className="h-6 text-xs">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {displayText ? (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {shouldTruncate ? `${displayText.slice(0, 100)}...` : displayText}
              </p>
              {isLong && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </Button>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground italic">Click edit to add description...</p>
          )}
        </div>
      )}
    </div>
  );
}
