"use client"

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square } from "lucide-react";
import { useConversation } from "@11labs/react";
import { useConversation as useAppConversation } from "@/context/conversation-context";
import { getHistoricalFigureById } from "@/data/historical-figures";

// Request microphone permission
async function requestMicrophonePermission() {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error("Microphone permission denied:", error);
    return false;
  }
}

// Get signed URL from our backend
async function getSignedUrl(): Promise<string> {
  try {
    const response = await fetch("/api/signed-url");
    if (!response.ok) {
      throw Error("Failed to get signed URL");
    }
    const data = await response.json();
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting signed URL:", error);
    throw error;
  }
}

interface EinsteinSdkVoiceProps {
  figureId: string;
}

export function EinsteinSdkVoice({ figureId }: EinsteinSdkVoiceProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useAppConversation();
  
  const [status, setStatus] = useState<"disconnected" | "connecting" | "connected" | "error">("disconnected");
  const [recognizedText, setRecognizedText] = useState<string>("");
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Use the ElevenLabs SDK hook
  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs - you can speak now");
      setStatus("connected");
      setIsResponding(false);
      // Alert for testing
      alert("Connected! You can speak now.");
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setStatus("disconnected");
      setSessionStarted(false);
      setIsResponding(false);
    },
    onError: (error) => {
      console.error("ElevenLabs conversation error:", error);
      setStatus("error");
      setIsResponding(false);
      // If there's an error, we can show a message to the user
      addAgentMessage("I'm experiencing some technical difficulties. Please try again.");
    },
    onMessage: (message: any) => {
      console.log("Message from ElevenLabs:", message);
      
      // Check and process by message type
      const msgType = message.type as string;
      
      if (msgType === "speech-started") {
        setIsResponding(true);
      } else if (msgType === "speech-ended") {
        setIsResponding(false);
      } else if (msgType === "transcript") {
        // Update recognized text when user is speaking
        const content = (message as any).content || "";
        setRecognizedText(content);
      } else if (msgType === "message") {
        // Add the agent's response to our conversation context
        const content = (message as any).content || (message as any).message || "";
        if (content) {
          addAgentMessage(content);
        }
      }
    },
  });

  // Start conversation with Einstein
  async function startConversation() {
    if (status === "connected") return;
    
    setStatus("connecting");
    setIsResponding(true);
    
    try {
      // Request microphone permission first
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        console.error("Microphone permission denied");
        setStatus("error");
        setIsResponding(false);
        return;
      }
      
      // Get signed URL from our backend
      const signedUrl = await getSignedUrl();
      console.log("Got signed URL:", signedUrl);
      
      // Try direct agent ID approach as an alternative
      console.log("Starting with agent ID directly");
      
      // Using direct agent ID instead of signed URL 
      const sessionOptions = { agentId: "hWQi3k8Rnma2afkUtNKE" };
      
      // Start the conversation session
      console.log("Starting session with options:", sessionOptions);
      const conversationId = await conversation.startSession(sessionOptions);
      console.log("Conversation started with ID:", conversationId);
      setSessionStarted(true);
    } catch (error) {
      console.error("Failed to start conversation:", error);
      setStatus("error");
      setIsResponding(false);
    }
  }

  // End the conversation
  async function stopConversation() {
    if (status !== "connected") return;
    
    try {
      await conversation.endSession();
      console.log("Conversation ended");
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  }

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (status === "connected") {
        conversation.endSession().catch(console.error);
      }
    };
  }, [conversation, status]);

  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Speech recognition status indicator - only show recognized text */}
      {status === "connected" && recognizedText && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-white text-xl max-w-lg bg-black/40 px-4 py-2 rounded-lg">"{recognizedText}"</div>
        </div>
      )}
      
      {/* Button Container - Fixed at the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center">
        {status !== "connected" && (
          <Button
            onClick={startConversation}
            className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light"
            disabled={status === "connecting" || isResponding}
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>
              {status === "connecting" 
                ? "CONNECTING..." 
                : isResponding 
                  ? "EINSTEIN IS SPEAKING..." 
                  : "SPEAK WITH EINSTEIN"}
            </span>
          </Button>
        )}
        
        {status === "connected" && (
          <Button
            onClick={stopConversation}
            className="bg-green-500/50 border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-green-600/50 transition-all duration-200 flex items-center justify-center text-xs font-light pulse-animation"
            disabled={isResponding}
          >
            <Square className="h-4 w-4 mr-2" />
            <span>{isResponding ? "EINSTEIN IS SPEAKING..." : "EINSTEIN IS LISTENING..."}</span>
          </Button>
        )}
      </div>
    </div>
  );
}