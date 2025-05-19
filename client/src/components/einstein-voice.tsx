import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation as useAppConversation } from "@/context/conversation-context";

interface EinsteinVoiceProps {
  figureId: string;
}

// Define speech recognition interface
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onaudiostart: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onresult: (event: any) => void;
  onspeechend: (event: Event) => void;
  onspeechstart: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: any) => void;
  onnomatch: (event: Event) => void;
  onsoundstart: (event: Event) => void;
  onsoundend: (event: Event) => void;
  onstart: (event: Event) => void;
}

interface SpeechRecognitionEvent {
  results: {
    item: (index: number) => {
      item: (index: number) => {
        transcript: string;
      };
    };
    length: number;
    isFinal: boolean;
  };
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

// Secure API function for interacting with ElevenLabs through our backend proxy
async function getEinsteinResponse(message: string, figureId: string = 'einstein'): Promise<string> {
  try {
    // Use our secure backend proxy instead of calling ElevenLabs directly
    const response = await fetch('/api/agent-audio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: message,
        figureId: figureId
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.response || "I'm sorry, I couldn't process that. Please try again.";
  } catch (error) {
    console.error("Error getting response:", error);
    return "I'm experiencing some technical difficulties. Please try again.";
  }
}

export function EinsteinVoice({ figureId }: EinsteinVoiceProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useAppConversation();
  
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [isListening, setIsListening] = useState(false);
  const [statusText, setStatusText] = useState("SPEAK WITH EINSTEIN");
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Check if browser supports speech recognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = 'en-US';
      
      // Configure event handlers
      recognitionInstance.onstart = () => {
        setIsListening(true);
        setStatusText("LISTENING...");
      };
      
      recognitionInstance.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        setStatusText("PROCESSING...");
        
        // Add user message to conversation
        await addUserMessage(transcript);
        setIsResponding(true);
        
        // Get response from ElevenLabs
        try {
          const response = await getEinsteinResponse(transcript, figure?.id);
          addAgentMessage(response);
        } catch (error) {
          console.error("Error getting response:", error);
          addAgentMessage("I'm experiencing some technical difficulties. Please try again.");
        }
        
        setIsResponding(false);
        setStatusText("SPEAK WITH EINSTEIN");
      };
      
      recognitionInstance.onerror = (event) => {
        console.error("Speech recognition error:", event);
        setIsListening(false);
        setStatusText("ERROR. TRY AGAIN");
      };
      
      recognitionInstance.onend = () => {
        setIsListening(false);
        if (statusText === "LISTENING...") {
          setStatusText("PROCESSING...");
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.error("Speech recognition not supported in this browser");
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.abort();
      }
    };
  }, [addAgentMessage, addUserMessage, setIsResponding]);
  
  // Start conversation with ElevenLabs
  const handleStartConversation = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    setStatusText("CONNECTING...");
    
    try {
      // Simulate connecting to verify browser compatibility
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (!recognition) {
        throw new Error("Speech recognition not available");
      }
      
      // All good, set to ready
      setConversationState("ready");
      setStatusText("SPEAK WITH EINSTEIN");
    } catch (error) {
      console.error("Error starting conversation:", error);
      setConversationState("initial");
      setStatusText("FAILED TO CONNECT. TRY AGAIN");
    }
  };
  
  // Handle microphone button click
  const handleMicButtonClick = () => {
    if (conversationState !== "ready" || !recognition) return;
    
    if (!isListening && !isResponding) {
      // Start listening
      recognition.start();
    } else if (isListening) {
      // Stop listening
      recognition.stop();
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
            <span>{statusText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}