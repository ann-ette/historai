import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation as useAppConversation } from "@/context/conversation-context";

// SpeechRecognition interface for TypeScript
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

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

interface DirectApiVoiceProps {
  figureId: string;
}

export function DirectApiVoice({ figureId }: DirectApiVoiceProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useAppConversation();
  
  const [conversationState, setConversationState] = useState<"initial" | "ready" | "listening">("initial");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>("");
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    // Browser compatibility
    const SpeechRecognitionAPI = (
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ) as SpeechRecognitionConstructor;

    if (SpeechRecognitionAPI) {
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        console.log("Speech recognition result received!", event.results.length);
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          console.log(`Transcript ${i}: ${transcript}, isFinal: ${event.results[i].isFinal}`);
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
        
        // Update recognized text
        const displayText = finalTranscript || interimTranscript;
        setRecognizedText(displayText);
        console.log("Updated recognized text:", displayText);
        
        // If we have a final transcript, automatically submit it
        if (finalTranscript && finalTranscript.trim() !== '') {
          console.log("Submitting final transcript:", finalTranscript);
          submitRecognizedSpeech(finalTranscript);
        }
      };
      
      recognition.onstart = () => {
        console.log("Speech recognition started successfully!");
      };
      
      recognition.onspeechstart = () => {
        console.log("Speech detected, listening...");
      };
      
      recognition.onspeechend = () => {
        console.log("Speech recognition speech ended");
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        
        if (conversationState === "listening") {
          setConversationState("ready");
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event);
        if (conversationState === "listening") {
          setConversationState("ready");
        }
      };
      
      recognition.onend = () => {
        console.log("Speech recognition ended, recognized text:", recognizedText);
        
        // If no final result was returned but we have interim text, use that
        if (recognizedText && conversationState === "listening") {
          console.log("Using interim text as final:", recognizedText);
          submitRecognizedSpeech(recognizedText);
        }
        
        if (conversationState === "listening") {
          console.log("Changing state back to ready");
          setConversationState("ready");
        }
      };
      
      recognitionRef.current = recognition;
    } else {
      console.warn('Speech recognition not supported in this browser');
      // Make alternative text input available in case speech recognition isn't supported
      setConversationState("ready");
    }
    
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [conversationState, recognizedText]);

  // Set to ready state on mount
  useEffect(() => {
    setConversationState("ready");
  }, []);

  // Start speech recognition - voice only experience
  const startListening = () => {
    // Only use speech recognition
    if (recognitionRef.current) {
      setConversationState("listening");
      setRecognizedText("");
      
      try {
        recognitionRef.current.start();
        console.log("Speech recognition started");
        
        // Set a timeout to automatically stop listening if no speech is detected
        setTimeout(() => {
          if (conversationState === "listening" && !recognizedText) {
            console.log("No speech detected, stopping recognition");
            stopListening();
            setConversationState("ready");
          }
        }, 10000); // 10 seconds timeout
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setConversationState("ready");
      }
    } else {
      console.warn('Speech recognition not available');
      // Even with speech recognition not available, keep the voice-only experience
      // Just toggle the button state to indicate we're listening
      setConversationState("listening");
      setTimeout(() => {
        if (conversationState === "listening") {
          setConversationState("ready");
        }
      }, 5000);
    }
  };

  // Stop speech recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  // Submit the recognized speech
  const submitRecognizedSpeech = async (speech: string) => {
    if (!speech || speech.trim() === "" || !figure || isResponding) return;
    
    // Reset for next input
    setRecognizedText("");
    
    try {
      setIsResponding(true);
      console.log("Processing question:", speech);
      
      // Add the user's message
      await addUserMessage(speech);
      
      // Send the question to our agent-audio endpoint
      console.log("Sending request to /api/agent-audio");
      const response = await axios.post('/api/agent-audio', {
        message: speech,
        conversationId: conversationId,
        figureId: figure?.id // Pass the figure ID for secure server-side agent key lookup
      });
      
      console.log("Response received:", response.data);
      
      if (response.data && response.data.response) {
        // Add Einstein's response to the conversation
        addAgentMessage(response.data.response);
        
        // Set conversation ID if available
        if (response.data.conversation_id) {
          setConversationId(response.data.conversation_id);
        }
        
        // Play audio response if available
        if (response.data.audio) {
          try {
            console.log("Audio data received, playing...");
            // Convert base64 audio to blob
            const audioData = atob(response.data.audio);
            const arrayBuffer = new ArrayBuffer(audioData.length);
            const uint8Array = new Uint8Array(arrayBuffer);
            
            for (let i = 0; i < audioData.length; i++) {
              uint8Array[i] = audioData.charCodeAt(i);
            }
            
            const audioBlob = new Blob([arrayBuffer], { type: 'audio/mpeg' });
            const audioUrl = URL.createObjectURL(audioBlob);
            
            // Clean up previous audio if exists
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current.src = '';
            }
            
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              console.log("Audio playback complete");
            };
            
            audio.onerror = (e) => {
              console.error("Audio playback error:", e);
            };
            
            audio.oncanplaythrough = () => {
              console.log("Audio loaded and ready to play");
            };
            
            await audio.play();
            console.log("Audio playback started");
          } catch (audioError) {
            console.error("Error playing audio:", audioError);
          }
        } else if (response.data.error) {
          console.warn("Audio generation failed:", response.data.error);
        } else {
          console.warn("No audio data in response");
        }
      } else {
        throw new Error('No response received from API');
      }
    } catch (error) {
      console.error("Error sending question:", error);
      addAgentMessage("I'm experiencing some technical difficulties. Please try again.");
    } finally {
      setIsResponding(false);
    }
  };
  
  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Speech recognition status indicator - only show recognized text, not "Listening..." */}
      {conversationState === "listening" && recognizedText && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 text-center">
          <div className="text-white text-xl max-w-lg bg-black/40 px-4 py-2 rounded-lg">"{recognizedText}"</div>
        </div>
      )}
      
      {/* Button Container - Fixed at the bottom of the screen */}
      <div className="fixed inset-x-0 bottom-6 flex justify-center">
        {conversationState === "ready" && (
          <Button
            onClick={startListening}
            className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs font-light"
            disabled={isResponding}
          >
            <Mic className="h-4 w-4 mr-2" />
            <span>{isResponding ? "EINSTEIN IS SPEAKING..." : "SPEAK WITH EINSTEIN"}</span>
          </Button>
        )}
        
        {conversationState === "listening" && (
          <Button
            onClick={stopListening}
            className="bg-white/20 border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-xs font-light pulse-animation"
          >
            <Mic className="h-4 w-4 mr-2 text-red-500 animate-pulse" />
            <span>SPEAK WITH EINSTEIN</span>
          </Button>
        )}
      </div>
    </div>
  );
}