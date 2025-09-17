
import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Square, Paperclip } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  allowAttachments?: boolean;
  files?: File[];
  setFiles?: (files: File[]) => void;
  stop?: () => void;
  isGenerating?: boolean;
  className?: string;
}

export function MessageInput({
  value,
  onChange,
  allowAttachments,
  files = [],
  setFiles,
  stop,
  isGenerating,
  className
}: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating && value.trim()) {
        const form = e.currentTarget.closest('form');
        form?.requestSubmit();
      }
    }
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center gap-2 bg-muted px-2 py-1 rounded text-sm">
              <Paperclip className="h-3 w-3" />
              <span>{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setFiles?.(files.filter((_, i) => i !== index))}
                className="h-4 w-4 p-0"
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Textarea
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="min-h-[40px] max-h-[120px] resize-none pr-12"
            disabled={isGenerating}
          />
        </div>
        <div className="flex flex-col gap-1">
          {allowAttachments && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.onchange = (e) => {
                  const target = e.target as HTMLInputElement;
                  if (target.files) {
                    setFiles?.([...files, ...Array.from(target.files)]);
                  }
                };
                input.click();
              }}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          )}
          {isGenerating ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={stop}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={!value.trim() || isGenerating}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
