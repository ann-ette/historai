import { useState, useCallback } from 'react';
import { useConversation } from '@/context/conversation-context';
import { HistoricalFigure } from '@/types';
import { getHistoricalFigureById } from '@/data/historical-figures';

export function useConversationWithFigure(figureId: string) {
  const { 
    conversations, 
    clearConversation
  } = useConversation();
  
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [isIntroComplete, setIsIntroComplete] = useState(false);
  
  const figure = getHistoricalFigureById(figureId);
  const messages = conversations[figureId] || [];

  // Skip video and go directly to conversation interface
  const startConversation = useCallback(() => {
    setIsVideoPlaying(true);
    setIsIntroComplete(false);
  }, []);
  
  // Handle video ending or skip directly to conversation
  const handleVideoEnded = useCallback(() => {
    setIsIntroComplete(true);
  }, []);
  
  const openQuestionModal = useCallback(() => {
    setShowQuestionModal(true);
  }, []);
  
  const closeQuestionModal = useCallback(() => {
    setShowQuestionModal(false);
  }, []);
  
  const resetConversation = useCallback(() => {
    clearConversation(figureId);
    setIsVideoPlaying(false);
    setIsIntroComplete(false);
  }, [clearConversation, figureId]);

  return {
    figure,
    messages,
    isVideoPlaying,
    isIntroComplete,
    showQuestionModal,
    startConversation,
    handleVideoEnded,
    openQuestionModal,
    closeQuestionModal,
    resetConversation
  };
}
