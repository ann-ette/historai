import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation as useAppConversation } from "@/context/conversation-context";

// Import types from ElevenLabs SDK
interface IConversation {
  connect: () => Promise<void>;
  disconnect: () => void;
  startRecording: () => void;
  stopRecording: () => void;
}

// Define constants for status and role types
enum ConversationStatus {
  SPEAKING = "speaking",
  AWAITING_INPUT = "awaiting_input",
  LISTENING = "listening",
  PROCESSING = "processing"
}

enum ConversationRole {
  ASSISTANT = "assistant",
  USER = "user"
}

interface ConversationMessage {
  source: string;
  message: string;
}

/**
 * Props for the ElevenLabs Agent component
 */
interface ElevenlabsAgentProps {
  figureId: string;  // ID of the historical figure to converse with
}

/**
 * ElevenlabsAgent component
 * 
 * This component uses the ElevenLabs SDK to create a real-time conversation
 * with a historical figure using voice input and output. It handles the full
 * duplex audio conversation with ElevenLabs' AI character.
 */
export function ElevenlabsAgent({ figureId }: ElevenlabsAgentProps) {
  // Get the historical figure data
  const figure = getHistoricalFigureById(figureId);
  
  // Get conversation context functions
  const { 
    addUserMessage, 
    addAgentMessage, 
    isResponding, 
    setIsResponding 
  } = useAppConversation();
  
  // Component state
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("SPEAK WITH EINSTEIN");
  
  // References to maintain conversation and audio context
  const conversationRef = useRef<IConversation | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  /**
   * Cleanup resources when component unmounts
   */
  useEffect(() => {
    return () => {
      if (conversationRef.current) {
        conversationRef.current.disconnect();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);
  
  /**
   * Initialize the conversation with ElevenLabs API using our secure backend proxy
   */
  const initializeConversation = async () => {
    if (!figure?.agentKey) {
      console.error("No agent key available for this historical figure");
      return;
    }
    
    try {
      // Create audio context for WebAudio API
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContext();
      
      // Get a signed URL from our secure backend (no API key in client)
      const signedUrlResponse = await fetch(`/api/signed-url?figureId=${figureId}`);
      if (!signedUrlResponse.ok) {
        throw new Error("Failed to get signed URL from server");
      }
      
      const { signedUrl } = await signedUrlResponse.json();
      if (!signedUrl) {
        throw new Error("No signed URL returned from server");
      }
      
      // Import dynamically to avoid TypeScript errors
      import('@11labs/client').then(({ Conversation }) => {
        // Create conversation instance with ElevenLabs SDK using the signed URL
        // instead of direct API key authentication
        const conversation = new Conversation({
          signedUrl: signedUrl, // Use signed URL instead of API key - the agentId is now handled server-side
          audioContext: audioContextRef.current as AudioContext,
          mode: "duplex", // Full duplex mode for real-time conversation
          autoConnect: false, // Connect manually for better control
          
          // Handle conversation status changes
          onStatusChange: (status: string) => {
            switch (status) {
              case ConversationStatus.SPEAKING:
                setIsResponding(true);
                setStatusText("EINSTEIN IS SPEAKING...");
                setIsListening(false);
                break;
              case ConversationStatus.AWAITING_INPUT:
                setIsResponding(false);
                setStatusText("SPEAK WITH EINSTEIN");
                setIsListening(false);
                break;
              case ConversationStatus.LISTENING:
                setIsListening(true);
                setStatusText("LISTENING...");
                break;
              default:
                break;
            }
          },
          
          // Handle messages from ElevenLabs
          onMessage: (message: ConversationMessage) => {
            if (message.source === ConversationRole.ASSISTANT) {
              addAgentMessage(message.message);
            } else if (message.source === ConversationRole.USER) {
              addUserMessage(message.message);
            }
          },
          
          // Handle errors
          onError: (error: Error) => {
            console.error("ElevenLabs conversation error:", error);
            setStatusText("ERROR. TRY AGAIN");
            setIsResponding(false);
            setIsListening(false);
          }
        });
        
        conversationRef.current = conversation as unknown as IConversation;
      }).catch(error => {
        console.error("Failed to import ElevenLabs SDK:", error);
      });
    } catch (error) {
      console.error("Error initializing conversation:", error);
    }
  };
  
  /**
   * Handles the start conversation button click
   * Initializes and connects to ElevenLabs API
   */
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Update UI state
    setConversationState("connecting");
    setStatusText("CONNECTING...");
    
    try {
      // Initialize conversation if needed
      if (!conversationRef.current) {
        initializeConversation();
      }
      
      // Connect to ElevenLabs
      if (conversationRef.current) {
        await conversationRef.current.connect();
        setConversationState("ready");
        setStatusText("SPEAK WITH EINSTEIN");
      } else {
        throw new Error("Failed to initialize conversation");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      setConversationState("initial");
      setStatusText("FAILED TO CONNECT. TRY AGAIN");
    }
  };
  
  /**
   * Handles microphone button interactions
   * Toggles between listening and processing states
   */
  const handleMicButtonClick = () => {
    if (conversationState !== "ready" || !conversationRef.current) return;
    
    if (!isListening && !isResponding) {
      // Start listening
      conversationRef.current.startRecording();
      setIsListening(true);
      setStatusText("LISTENING...");
    } else if (isListening) {
      // Stop listening and process speech
      conversationRef.current.stopRecording();
      setIsListening(false);
      setStatusText("PROCESSING...");
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
            <span>{statusText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}