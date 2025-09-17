
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

interface TagListRendererProps {
  label: string;
  tags: string[] | any;
  onChange?: (tags: string[]) => void;
}

export function TagListRenderer({ label, tags, onChange }: TagListRendererProps) {
  // Ensure tags is always an array
  const tagArray = React.useMemo(() => {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    if (typeof tags === 'string') return [tags];
    return [];
  }, [tags]);

  const [newTag, setNewTag] = useState('');

  const addTag = () => {
    if (newTag.trim() && !tagArray.includes(newTag.trim())) {
      const updatedTags = [...tagArray, newTag.trim()];
      onChange?.(updatedTags);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const updatedTags = tagArray.filter(tag => tag !== tagToRemove);
    onChange?.(updatedTags);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Add tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="h-7 text-xs w-24"
          />
          <Button size="sm" variant="ghost" onClick={addTag} className="h-7 w-7 p-0">
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1">
        {tagArray.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-xs">
            {tag}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => removeTag(tag)}
              className="ml-1 h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-2 w-2" />
            </Button>
          </Badge>
        ))}
        {tagArray.length === 0 && (
          <span className="text-xs text-muted-foreground italic">No tags</span>
        )}
      </div>
    </div>
  );
}
