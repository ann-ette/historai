import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Message, Conversation, HistoricalFigure } from '@/types';
import { getActiveHistoricalFigure } from '@/data/historical-figures';

interface ConversationContextType {
  currentFigureId: string;
  setCurrentFigureId: (id: string) => void;
  conversations: Record<string, Message[]>;
  addUserMessage: (text: string) => Promise<void>;
  addAgentMessage: (text: string) => void;
  isResponding: boolean;
  setIsResponding: (isResponding: boolean) => void;
  clearConversation: (figureId?: string) => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

export function ConversationProvider({ children }: { children: ReactNode }) {
  const [currentFigureId, setCurrentFigureId] = useState<string>(getActiveHistoricalFigure().id);
  const [conversations, setConversations] = useState<Record<string, Message[]>>({});
  const [isResponding, setIsResponding] = useState(false);
  
  // Load conversations from localStorage on initial render
  useEffect(() => {
    const savedConversations = localStorage.getItem('historai-conversations');
    if (savedConversations) {
      try {
        setConversations(JSON.parse(savedConversations));
      } catch (e) {
        console.error('Failed to parse saved conversations', e);
      }
    }
  }, []);
  
  // Save conversations to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(conversations).length > 0) {
      localStorage.setItem('historai-conversations', JSON.stringify(conversations));
    }
  }, [conversations]);

  const addUserMessage = async (text: string) => {
    const timestamp = Date.now();
    const userMessageId = `msg-${timestamp}-user`;
    
    setIsResponding(true);
    
    // Add user message
    setConversations(prev => {
      const figureMessages = [...(prev[currentFigureId] || [])];
      
      figureMessages.push({
        id: userMessageId,
        sender: 'user',
        text,
        timestamp,
        figureId: currentFigureId
      });
      
      return {
        ...prev,
        [currentFigureId]: figureMessages
      };
    });
  };
  
  const addAgentMessage = (text: string) => {
    setConversations(prev => {
      const figureMessages = [...(prev[currentFigureId] || [])];
      
      figureMessages.push({
        id: `msg-${Date.now()}-figure`,
        sender: 'historical-figure',
        text: text,
        timestamp: Date.now(),
        figureId: currentFigureId
      });
      
      return {
        ...prev,
        [currentFigureId]: figureMessages
      };
    });
    
    setIsResponding(false);
  };

  const clearConversation = (figureId?: string) => {
    const idToClear = figureId || currentFigureId;
    
    setConversations(prev => {
      const newConversations = { ...prev };
      delete newConversations[idToClear];
      return newConversations;
    });
  };

  return (
    <ConversationContext.Provider
      value={{
        currentFigureId,
        setCurrentFigureId,
        conversations,
        addUserMessage,
        addAgentMessage,
        isResponding,
        setIsResponding,
        clearConversation
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (context === undefined) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
