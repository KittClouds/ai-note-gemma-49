
import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditorProps {
  value: string;
  onSave: (value: string) => void;
  onCancel: () => void;
  className?: string;
}

export function InlineEditor({ value, onSave, onCancel, className }: InlineEditorProps) {
  const [editValue, setEditValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onCancel();
    }
  };

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed) {
      onSave(trimmed);
    } else {
      onCancel();
    }
  };

  const handleBlur = () => {
    handleSave();
  };

  return (
    <Input
      ref={inputRef}
      value={editValue}
      onChange={(e) => setEditValue(e.target.value)}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      className={className}
    />
  );
}
