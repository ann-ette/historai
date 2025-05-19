import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { QuestionModal } from "@/components/question-modal";
import { useConversationWithFigure } from "@/hooks/use-conversation";
import { Mic, MessageSquare, Volume2 } from "lucide-react";
import { startConversation, getConversationResponse, getAudioResponse } from "@/lib/elevenlabs";
import { useConversation } from "@/context/conversation-context";

interface HistoricalFigureProps {
  figureId: string;
}

export function HistoricalFigure({ figureId }: HistoricalFigureProps) {
  // Get figure info from the conversation hook
  const {
    figure,
    isVideoPlaying,
    isIntroComplete,
    showQuestionModal,
    openQuestionModal,
    closeQuestionModal,
    handleVideoEnded
  } = useConversationWithFigure(figureId);
  
  // Context for managing conversation state
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useConversation();
  
  // Component state
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [showConversationUI, setShowConversationUI] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (isVideoPlaying && videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error("Error playing video:", err);
      });
    }
  }, [isVideoPlaying]);

  // Start session when intro is complete
  useEffect(() => {
    if (isIntroComplete && figure) {
      setShowConversationUI(true);
      initializeConversation();
    }
  }, [isIntroComplete, figure]);

  // Initialize ElevenLabs conversation
  const initializeConversation = async () => {
    if (!figure) return;
    
    try {
      setIsResponding(true);
      const id = await startConversation(figure.id);
      setConversationId(id);
      setIsResponding(false);
      console.log("Conversation started with ID:", id);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setIsResponding(false);
    }
  };

  // Send message to ElevenLabs and play audio response
  const sendMessage = async (text: string) => {
    if (!conversationId || !figure) {
      console.error("No active conversation");
      return;
    }
    
    try {
      // Add user message to the conversation
      await addUserMessage(text);
      setIsResponding(true);
      
      // Get agent response
      const response = await getConversationResponse(text, conversationId);
      
      // Add agent message to the conversation
      addAgentMessage(response.response);
      
      // Get and play audio response
      setIsSpeaking(true);
      const audioStream = await getAudioResponse(conversationId);
      
      if (audioStream && audioRef.current) {
        const audioBlob = await new Response(audioStream).blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
      } else {
        setIsSpeaking(false);
      }
      
      setIsResponding(false);
    } catch (error) {
      console.error("Error in conversation:", error);
      setIsResponding(false);
      setIsSpeaking(false);
    }
  };

  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="relative w-full rounded-lg overflow-hidden shadow-2xl">
      <div className="aspect-[16/9] w-full relative">
        {/* Portrait Image */}
        {!isVideoPlaying && (
          <img
            src={figure.imageSrc}
            alt={figure.name}
            className="w-full h-full object-cover"
          />
        )}

        {/* Video */}
        {isVideoPlaying && figure.videoSrc && !showConversationUI && (
          <video
            ref={videoRef}
            src={figure.videoSrc}
            className="w-full h-full object-cover"
            onEnded={handleVideoEnded}
          />
        )}
        
        {/* ElevenLabs Conversation UI */}
        {showConversationUI && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <img
              src={figure.imageSrc}
              alt={figure.name}
              className="w-full h-full object-cover"
            />
            
            <div className="absolute bottom-8 left-0 right-0 flex justify-center">
              {conversationId ? (
                <div className="flex flex-col items-center">
                  <p className="text-white text-center text-2xl mb-2">
                    Ready to answer your questions
                  </p>
                  <p className="text-white/80 text-center text-sm mb-6">
                    Click the button below to ask a question
                  </p>
                  
                  <Button
                    onClick={openQuestionModal}
                    className="bg-[#1b2230] text-white w-[360px] py-3.5 tracking-wider hover:bg-[#272e3b] transition-all duration-200 flex items-center justify-center uppercase text-sm"
                    disabled={isResponding || isSpeaking}
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    <span>SPEAK WITH ALBERT EINSTEIN</span>
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center bg-transparent">
                  <p className="text-white text-center mb-3">Connecting to {figure.name}</p>
                  <Button
                    disabled
                    className="bg-[#1b2230] text-white w-[360px] py-3.5 tracking-wider flex items-center justify-center uppercase text-sm"
                  >
                    <Mic className="h-5 w-5 mr-2" />
                    <span>SPEAK WITH ALBERT EINSTEIN</span>
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="absolute inset-0 flex items-end justify-center pb-10">
          {/* Speak Button - Initial State - Positioned at bottom */}
          {!isVideoPlaying && (
            <Button
              onClick={() => handleVideoEnded()}
              className="bg-[#1b2230] text-white w-[360px] py-3.5 tracking-wider hover:bg-[#272e3b] transition-all duration-200 flex items-center justify-center uppercase text-sm"
            >
              <Mic className="h-5 w-5 mr-2" />
              <span>SPEAK WITH ALBERT EINSTEIN</span>
            </Button>
          )}
        </div>
      </div>

      {/* Hidden audio element for playing responses */}
      <audio ref={audioRef} className="hidden" />

      {/* Question Modal */}
      <QuestionModal
        isOpen={showQuestionModal}
        onClose={closeQuestionModal}
        onSubmit={sendMessage}
        figureName={figure.name}
      />
    </div>
  );
}
