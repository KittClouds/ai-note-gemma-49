
import React from 'react';
import { MessageCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatSessionItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isActive,
  onSelect,
  onDelete
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-muted/50 group",
        isActive && "bg-muted"
      )}
      onClick={onSelect}
    >
      <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{session.title}</p>
        <p className="text-xs text-muted-foreground">
          {session.messages.length} messages
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
};
