
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatSession, ChatMessage } from '@/types/chat';

interface ChatHistoryContextType {
  sessions: ChatSession[];
  activeSessionId: string | null;
  activeSession: ChatSession | null;
  createNewSession: () => string;
  selectSession: (sessionId: string) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  deleteSession: (sessionId: string) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | null>(null);

export const useChatHistory = () => {
  const context = useContext(ChatHistoryContext);
  if (!context) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
};

interface ChatHistoryProviderProps {
  children: ReactNode;
}

const STORAGE_KEY = 'chat-sessions';

export const ChatHistoryProvider: React.FC<ChatHistoryProviderProps> = ({ children }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedSessions = JSON.parse(stored).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }))
        }));
        setSessions(parsedSessions);
      } catch (error) {
        console.error('Failed to load chat sessions:', error);
      }
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = (): string => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  };

  const selectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
  };

  const addMessageToSession = (sessionId: string, message: ChatMessage) => {
    setSessions(prev => prev.map(session => {
      if (session.id === sessionId) {
        const updatedSession = {
          ...session,
          messages: [...session.messages, message],
          updatedAt: new Date()
        };

        // Auto-generate title from first user message
        if (session.messages.length === 0 && message.role === 'user') {
          updatedSession.title = message.content.slice(0, 50) + (message.content.length > 50 ? '...' : '');
        }

        return updatedSession;
      }
      return session;
    }));
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
    setSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, title, updatedAt: new Date() }
        : session
    ));
  };

  const deleteSession = (sessionId: string) => {
    setSessions(prev => prev.filter(session => session.id !== sessionId));
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
    }
  };

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  return (
    <ChatHistoryContext.Provider value={{
      sessions,
      activeSessionId,
      activeSession,
      createNewSession,
      selectSession,
      addMessageToSession,
      updateSessionTitle,
      deleteSession
    }}>
      {children}
    </ChatHistoryContext.Provider>
  );
};
