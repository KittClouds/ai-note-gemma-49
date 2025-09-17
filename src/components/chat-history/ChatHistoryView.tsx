
import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatHistory } from '@/contexts/ChatHistoryContext';
import { ChatSessionItem } from './ChatSessionItem';

export const ChatHistoryView: React.FC = () => {
  const {
    sessions,
    activeSessionId,
    createNewSession,
    selectSession,
    deleteSession
  } = useChatHistory();

  const handleNewChat = () => {
    createNewSession();
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 border-b">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">No chat history yet</p>
              <p className="text-xs mt-1">Start a new conversation to begin</p>
            </div>
          ) : (
            sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isActive={session.id === activeSessionId}
                onSelect={() => selectSession(session.id)}
                onDelete={() => deleteSession(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
