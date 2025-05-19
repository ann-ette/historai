"use client"

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useConversation } from "@11labs/react";
import { cn } from "@/lib/utils";
import { Mic, Square } from "lucide-react";
import { useConversation as useAppConversation } from "@/context/conversation-context";

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

interface ConvAIProps {
  figureId: string;
}

export function ConvAI({ figureId }: ConvAIProps) {
  const { addUserMessage, addAgentMessage, currentFigureId } = useAppConversation();
  const [lastFigureId, setLastFigureId] = useState<string>(currentFigureId || figureId);
  
  // This will force a re-creation of the conversation when the figure changes
  const displayFigureId = currentFigureId || figureId;
  
  const conversation = useConversation({
    onConnect: () => {
      console.log("connected");
    },
    onDisconnect: () => {
      console.log("disconnected");
    },
    onError: (error) => {
      console.log("ERROR:", error);
      alert("An error occurred during the conversation");
    },
    onMessage: (message: any) => {
      console.log("MESSAGE:", message);
      
      const source = message.source as string;
      const messageText = message.message || message.text || "";
      
      if (source === "user") {
        // Add user message to conversation context
        if (messageText) {
          addUserMessage(messageText);
        }
      } else {
        // Anything not from the user is assumed to be from the agent
        if (messageText) {
          addAgentMessage(messageText);
        }
      }
    },
  });
  
  // End previous session and start a new one when the figure changes
  useEffect(() => {
    if (displayFigureId !== lastFigureId) {
      setLastFigureId(displayFigureId);
      
      if (conversation.status === "connected") {
        // End the previous conversation
        conversation.endSession().then(() => {
          console.log("Previous conversation ended due to figure change");
        }).catch(error => {
          console.error("Error ending previous conversation:", error);
        });
      }
    }
  }, [displayFigureId, lastFigureId, conversation]);

  async function startConversation() {
    // Request microphone permission first
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      alert("Microphone permission is required");
      return;
    }
    
    try {
      // Get the signed URL with the current figure's agent key
      const signedUrl = await getSignedUrl();
      console.log("Starting conversation with URL:", signedUrl);
      
      // Start the session
      const conversationId = await conversation.startSession({ 
        signedUrl 
      });
      console.log("Conversation started with ID:", conversationId);
    } catch (error) {
      console.error("Error starting conversation:", error);
      alert("Failed to start conversation");
    }
  }

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      console.log("Conversation ended");
    } catch (error) {
      console.error("Error ending conversation:", error);
    }
  }, [conversation]);

  return (
    <div className="flex flex-col items-center w-full h-full justify-end">
      {/* No message display - removed as requested */}
      
      <div className="flex flex-col gap-y-4 items-center mb-16">
        <div className="relative mx-auto mb-8">
          {/* Sparkling effect container */}
          <div 
            className={cn(
              "sparkle-container relative w-16 h-16 flex items-center justify-center",
              conversation.status === "connected" && "active"
            )}
          >
            {/* Center glow */}
            <div 
              className={cn(
                "absolute w-10 h-10 rounded-full transition-all duration-500",
                conversation.status === "connected" && conversation.isSpeaking
                  ? "bg-amber-500/60 animate-pulse-slow"
                  : conversation.status === "connected"
                    ? "bg-blue-500/40"
                    : "bg-gray-500/30"
              )}
            ></div>
            
            {/* Flame-like effects */}
            {conversation.status === "connected" && conversation.isSpeaking && (
              <>
                <div className="flame flame-1"></div>
                <div className="flame flame-2"></div>
                <div className="flame flame-3"></div>
              </>
            )}
            
            {/* Individual sparkles - only show when speaking */}
            {conversation.status === "connected" && conversation.isSpeaking && (
              <>
                <div className="sparkle sparkle-1"></div>
                <div className="sparkle sparkle-2"></div>
                <div className="sparkle sparkle-3"></div>
                <div className="sparkle sparkle-4"></div>
                <div className="sparkle sparkle-5"></div>
                <div className="sparkle sparkle-6"></div>
                <div className="sparkle sparkle-7"></div>
                <div className="sparkle sparkle-8"></div>
              </>
            )}
          </div>
        </div>

        {conversation.status !== "connected" ? (
          <Button
            className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light"
            onClick={startConversation}
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>SPEAK WITH EINSTEIN</span>
          </Button>
        ) : (
          <Button
            className="bg-white/20 border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-xs font-light"
            onClick={stopConversation}
          >
            <Square className="h-4 w-4 mr-2" />
            <span>{conversation.isSpeaking ? "EINSTEIN IS SPEAKING..." : "END CONVERSATION"}</span>
          </Button>
        )}
      </div>
    </div>
  );
}