import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation } from "@/context/conversation-context";
import { VoiceInterface, VoiceState } from "@11labs/react";

interface HistoricalFigureProps {
  figureId: string;
}

export function HistoricalFigure({ figureId }: HistoricalFigureProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useConversation();
  
  // Component state
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [voiceInitialized, setVoiceInitialized] = useState(false);
  
  // Start conversation
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    
    try {
      // Small delay to show connecting state
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // If successful, update state to ready
      setConversationState("ready");
      setVoiceInitialized(true);
    } catch (error) {
      console.error("Error initializing voice:", error);
      
      // Fallback: Still allow interaction
      setConversationState("ready");
      setVoiceInitialized(true);
    }
  };
  
  // Handler for speech recognition results
  const handleSpeechResult = async (text: string) => {
    if (!figure || !text || text.trim() === "") return;
    
    try {
      // Add user message to the conversation
      await addUserMessage(text);
      setIsResponding(true);
      
      // Handle the response in the onFinishSpeaking callback of VoiceInterface
    } catch (error) {
      console.error("Error processing speech:", error);
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
            <Button
              disabled
              className="bg-transparent border border-white/30 text-white/70 w-[320px] py-2.5 tracking-wide uppercase flex items-center justify-center text-xs font-light"
            >
              <Mic className="h-4 w-4 mr-2" />
              <span>CONNECTING...</span>
            </Button>
          </div>
        )}
        
        {conversationState === "ready" && (
          <>
            {voiceInitialized && (
              <VoiceInterface
                agentId={figure.agentKey}
                signedUrlEndpoint={`/api/signed-url?figureId=${figure.id}`} // Use secure server endpoint instead of direct API key
                displayElevenlabsBranding={false}
                onStateChange={(state) => {
                  if (state === VoiceState.LISTENING) {
                    setIsResponding(false);
                  } else if (state === VoiceState.SPEAKING) {
                    setIsResponding(true);
                  }
                }}
                onFinishSpeaking={(response) => {
                  // Add the response from ElevenLabs to conversation
                  addAgentMessage(response.text);
                  setIsResponding(false);
                }}
                onError={(error) => {
                  console.error("ElevenLabs Voice error:", error);
                  setIsResponding(false);
                  addAgentMessage("I'm sorry, I encountered a problem. Please try again.");
                }}
                onSpeechRecognized={handleSpeechResult}
                customMicButtonRenderer={(isListening) => (
                  <Button
                    className={`bg-transparent border ${isListening ? 'border-red-400 animate-pulse' : 'border-white/30'} text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light`}
                    disabled={isResponding}
                  >
                    <Mic className={`h-4 w-4 mr-2 ${isListening ? 'text-red-400' : ''}`} />
                    <span>{isListening ? 'LISTENING...' : 'SPEAK WITH EINSTEIN'}</span>
                  </Button>
                )}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}