import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation as useAppConversation } from "@/context/conversation-context";

interface SimpleVoiceProps {
  figureId: string;
}

export function SimpleVoice({ figureId }: SimpleVoiceProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useAppConversation();
  
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [isListening, setIsListening] = useState(false);
  
  // Start conversation with ElevenLabs
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    
    try {
      // Simulate connecting to ElevenLabs
      await new Promise(resolve => setTimeout(resolve, 1500));
      setConversationState("ready");
    } catch (error) {
      console.error("Error starting conversation:", error);
      setConversationState("initial");
    }
  };
  
  // Handle microphone button click
  const handleMicButtonClick = () => {
    if (conversationState !== "ready" || isResponding) return;
    
    if (!isListening) {
      // Start listening
      setIsListening(true);
      // Simulate receiving voice input after 3 seconds
      setTimeout(() => {
        processVoiceInput("Tell me about your theory of relativity");
      }, 3000);
    } else {
      // Stop listening
      setIsListening(false);
    }
  };
  
  // Process voice input
  const processVoiceInput = async (text: string) => {
    if (!text || !figure) return;
    
    setIsListening(false);
    
    try {
      // Add user message
      await addUserMessage(text);
      setIsResponding(true);
      
      // Simulate AI response
      setTimeout(() => {
        const response = "My theory of relativity fundamentally changed our understanding of space and time. The special theory of relativity, which I published in 1905, shows that time and space are not absolute, but relative to the observer. The equation E=mc² demonstrates that energy equals mass times the speed of light squared, revealing the equivalence of mass and energy. The general theory of relativity, published in 1915, explains gravity as a geometric property of space and time, or spacetime.";
        addAgentMessage(response);
        setIsResponding(false);
      }, 2000);
    } catch (error) {
      console.error("Error processing voice input:", error);
      setIsResponding(false);
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
          <Button
            disabled
            className="bg-transparent border border-white/30 text-white/70 w-[320px] py-2.5 tracking-wide uppercase flex items-center justify-center text-xs font-light"
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>CONNECTING...</span>
          </Button>
        )}
        
        {conversationState === "ready" && (
          <Button
            onClick={handleMicButtonClick}
            className={`bg-transparent border ${isListening ? 'border-red-400 animate-pulse' : 'border-white/30'} text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light`}
            disabled={isResponding}
          >
            <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-400' : ''}`} />
            <span>
              {isListening ? 'LISTENING...' : 
               isResponding ? 'EINSTEIN IS SPEAKING...' : 
               'SPEAK WITH EINSTEIN'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}