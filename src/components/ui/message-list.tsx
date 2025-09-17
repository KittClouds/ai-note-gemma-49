
import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  className?: string;
}

export function MessageList({ messages, isTyping, className }: MessageListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {messages.map((message) => (
        <div
          key={message.id}
          className={cn(
            "flex gap-3",
            message.role === 'user' ? 'justify-end' : 'justify-start'
          )}
        >
          {message.role === 'assistant' && (
            <div className="flex-shrink-0">
              <Bot className="h-6 w-6 text-primary" />
            </div>
          )}
          <div
            className={cn(
              "rounded-lg px-3 py-2 max-w-[80%]",
              message.role === 'user'
                ? "bg-primary text-primary-foreground ml-auto"
                : "bg-muted"
            )}
          >
            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
          </div>
          {message.role === 'user' && (
            <div className="flex-shrink-0">
              <User className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>
      ))}
      {isTyping && (
        <div className="flex gap-3 justify-start">
          <div className="flex-shrink-0">
            <Bot className="h-6 w-6 text-primary" />
          </div>
          <div className="bg-muted rounded-lg px-3 py-2">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
