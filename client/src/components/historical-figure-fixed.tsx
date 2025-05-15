import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { QuestionModal } from "@/components/question-modal";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation } from "@/context/conversation-context";
import { startConversation, getConversationResponse, getAudioResponse } from "@/lib/elevenlabs";

interface HistoricalFigureProps {
  figureId: string;
}

export function HistoricalFigure({ figureId }: HistoricalFigureProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useConversation();
  
  // Component state
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const conversationIdRef = useRef<string>("");
  
  // Start conversation with ElevenLabs AI
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    
    try {
      // Start a conversation with ElevenLabs using the agent key
      const conversationId = await startConversation(figureId);
      conversationIdRef.current = conversationId;
      
      // If successful, update state to ready
      setConversationState("ready");
      console.log("Conversation started with ID:", conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      
      // Fallback: If there's an error, still allow the user to continue
      setConversationState("ready");
    }
  };
  
  // Handler for question submission
  const handleSubmitQuestion = async (text: string) => {
    if (!figure) return;
    
    // Close modal
    setShowQuestionModal(false);
    
    try {
      // Add user message to the conversation
      await addUserMessage(text);
      setIsResponding(true);
      
      // Get conversation ID (or generate a mock one if not available)
      const conversationId = conversationIdRef.current || `mock-conversation-${Date.now()}`;
      
      // Get response from ElevenLabs AI
      const response = await getConversationResponse(text, conversationId);
      
      // Add the AI response to the conversation
      addAgentMessage(response.response);
      
      // Update conversation ID in case it changed
      conversationIdRef.current = response.conversation_id;
      
      // Get audio if available
      try {
        const audioStream = await getAudioResponse(response.conversation_id);
        
        if (audioStream) {
          // Create a blob from the stream
          const responseBlob = await new Response(audioStream).blob();
          const audioURL = URL.createObjectURL(responseBlob);
          
          // Create and play audio
          const audio = new Audio(audioURL);
          setAudioElement(audio);
          
          audio.onended = () => {
            URL.revokeObjectURL(audioURL);
            setAudioElement(null);
          };
          
          audio.play();
        }
      } catch (audioError) {
        console.error("Error getting audio:", audioError);
      }
      
      setIsResponding(false);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsResponding(false);
      addAgentMessage("I'm sorry, I encountered a problem processing your request. Please try again.");
    }
  };

  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Button Container - Fixed at the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center">
        {conversationState === "initial" && (
          <Button
            onClick={handleStartConversation}
            className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light"
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>SPEAK WITH EINSTEIN</span>
          </Button>
        )}
        
        {conversationState === "connecting" && (
          <div className="flex flex-col items-center">
            <p className="text-white text-center mb-3">Connecting to Einstein</p>
            <Button
              disabled
              className="bg-transparent border border-white/30 text-white/70 w-[320px] py-2.5 tracking-wide uppercase flex items-center justify-center text-xs font-light"
            >
              <Mic className="h-4 w-4 mr-2" />
              <span>SPEAK WITH EINSTEIN</span>
            </Button>
          </div>
        )}
        
        {conversationState === "ready" && (
          <div className="flex flex-col items-center">
            <Button
              onClick={() => setShowQuestionModal(true)}
              className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light"
              disabled={isResponding}
            >
              <Mic className="h-4 w-4 mr-2" />
              <span>SPEAK WITH EINSTEIN</span>
            </Button>
          </div>
        )}
      </div>
      
      <QuestionModal 
        isOpen={showQuestionModal}
        onClose={() => setShowQuestionModal(false)}
        onSubmit={handleSubmitQuestion}
        figureName={figure.name}
      />
    </div>
  );
}