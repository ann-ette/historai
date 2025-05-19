import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation as useAppConversation } from "@/context/conversation-context";
import { useConversation } from "@11labs/react";

// Define conversation status as string constants
const SPEAKING = "speaking";
const IDLE = "idle";
const CONNECTING = "connecting";
const DISCONNECTED = "disconnected";

// Define message interface to specify proper types
interface ElevenLabsMessage {
  role: string;
  content: string;
}

interface ElevenlabsVoiceProps {
  figureId: string;
}

/**
 * ElevenlabsVoice component
 * 
 * This component leverages the ElevenLabs React Hook to create
 * a conversational interface with historical figures. It handles 
 * the voice conversation state management and UI interactions.
 * 
 * @param figureId - ID of the historical figure to converse with
 */
export function ElevenlabsVoice({ figureId }: ElevenlabsVoiceProps) {
  const figure = getHistoricalFigureById(figureId);
  const { 
    addUserMessage, 
    addAgentMessage, 
    isResponding, 
    setIsResponding 
  } = useAppConversation();
  
  // Track conversation connection state
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  
  // Use the ElevenLabs conversation hook to manage the conversation
  const elevenLabs = useConversation({
    // Use signedUrl instead of direct API key for security
    // The API key is now kept on the server side only
    signedUrlEndpoint: `/api/signed-url?figureId=${figureId}`,
    
    // Einstein's voice ID - can be dynamically selected based on figureId
    voiceId: "ZQe5CZNOzWyzPSCn5a3c",
    
    // Process messages from the assistant
    onMessage: (message: ElevenLabsMessage) => {
      if (message.role === "assistant") {
        addAgentMessage(message.content);
      }
    },
    
    // Handle API errors
    onError: (error: Error) => {
      console.error("ElevenLabs API error:", error);
      addAgentMessage("I'm sorry, I encountered a problem connecting to my knowledge base. Please try again.");
      setIsResponding(false);
    },
    
    // Handle successful connection
    onConnect: () => {
      console.log("Successfully connected to ElevenLabs API");
      setConversationState("ready");
    },
    
    // Handle disconnection
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs API");
      setConversationState("initial");
    }
  });
  
  // Synchronize the conversation status with our app's UI state
  useEffect(() => {
    const status = elevenLabs.status as string;
    
    if (status === SPEAKING) {
      setIsResponding(true);
    } else if (status === IDLE || status === DISCONNECTED) {
      setIsResponding(false);
    }
  }, [elevenLabs.status, setIsResponding]);
  
  // Start conversation with ElevenLabs
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    
    try {
      // We need to specify some required parameters for the session
      await elevenLabs.startSession({
        agentId: "hWQi3k8Rnma2afkUtNKE" // Using Einstein's agent ID which is handled securely on the backend
      });
    } catch (error) {
      console.error("Error starting ElevenLabs session:", error);
      setConversationState("initial");
    }
  };
  
  // Handle microphone button 
  const handleMicClick = () => {
    if (elevenLabs.micMuted) {
      // If mic is muted, we want to start listening
      elevenLabs.sendUserActivity();
    } else {
      // If mic is not muted, toggle it
      elevenLabs.setVolume({ volume: 0 });
    }
  };

  // Show error if figure not found
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
          <Button
            onClick={handleMicClick}
            className={`bg-transparent border ${!elevenLabs.micMuted ? 'border-red-400 animate-pulse' : 'border-white/30'} text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light`}
            disabled={isResponding || (elevenLabs.status as string) === CONNECTING}
          >
            <Mic className={`h-4 w-4 mr-2 ${!elevenLabs.micMuted ? 'text-red-400' : ''}`} />
            <span>
              {(elevenLabs.status as string) === CONNECTING ? 'CONNECTING...' : 
               !elevenLabs.micMuted ? 'LISTENING...' : 
               isResponding ? 'EINSTEIN IS SPEAKING...' : 
               'SPEAK WITH EINSTEIN'}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
}