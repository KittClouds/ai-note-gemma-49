
import React from 'react';
import { cn } from '@/lib/utils';

interface ChatContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatContainer({ children, className }: ChatContainerProps) {
  return (
    <div className={cn("flex flex-col h-full", className)}>
      {children}
    </div>
  );
}

interface ChatMessagesProps {
  children: React.ReactNode;
  className?: string;
}

export function ChatMessages({ children, className }: ChatMessagesProps) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      {children}
    </div>
  );
}

interface ChatFormProps {
  children: React.ReactNode | ((props: { files: File[], setFiles: (files: File[]) => void }) => React.ReactNode);
  className?: string;
  isPending?: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export function ChatForm({ children, className, isPending, handleSubmit }: ChatFormProps) {
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <form onSubmit={handleSubmit} className={cn("p-4 border-t", className)}>
      {typeof children === 'function' ? children({ files, setFiles }) : children}
    </form>
  );
}
