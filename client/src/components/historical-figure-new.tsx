import { useState } from "react";
import { Button } from "@/components/ui/button";
import { QuestionModal } from "@/components/question-modal";
import { Mic } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { useConversation } from "@/context/conversation-context";

interface HistoricalFigureProps {
  figureId: string;
}

export function HistoricalFigure({ figureId }: HistoricalFigureProps) {
  const figure = getHistoricalFigureById(figureId);
  const { addUserMessage, addAgentMessage, isResponding, setIsResponding } = useConversation();
  
  // Component state
  const [conversationState, setConversationState] = useState<"initial" | "connecting" | "ready">("initial");
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  
  // Start conversation
  const startConversation = async () => {
    if (!figure) return;
    
    // Change to connecting state
    setConversationState("connecting");
    
    // Simulate connecting delay
    setTimeout(() => {
      setConversationState("ready");
    }, 2000);
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
      
      // Simulate getting a response
      setTimeout(async () => {
        // Get simulated response based on question content
        const lowerMessage = text.toLowerCase();
        let response = "I'm sorry, I don't understand. Can you try asking something else?";
        
        if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
          response = "Hello! How wonderful to meet you. What would you like to discuss today?";
        } else if (lowerMessage.includes("name")) {
          response = "My name is Albert Einstein. I was a physicist who developed the theory of relativity.";
        } else if (lowerMessage.includes("relativity") || lowerMessage.includes("theory")) {
          response = "My theory of relativity fundamentally changed our understanding of space and time. Simply put, E=mc², which means energy equals mass times the speed of light squared.";
        } else if (lowerMessage.includes("quantum")) {
          response = "Quantum mechanics is fascinating, though I had my reservations. As I once said, 'God does not play dice with the universe.' The probabilistic nature of quantum theory challenged my deterministic view.";
        } else if (lowerMessage.includes("education") || lowerMessage.includes("school")) {
          response = "I was not a particularly exceptional student in the traditional sense. Learning comes in many forms, and I found that curiosity and imagination were my greatest teachers.";
        } else if (lowerMessage.includes("god") || lowerMessage.includes("religion")) {
          response = "I believe in Spinoza's God who reveals himself in the harmony of all that exists, but not in a God who concerns himself with the fate and actions of human beings.";
        } else if (lowerMessage.includes("imagination") || lowerMessage.includes("creativity")) {
          response = "Imagination is more important than knowledge. Knowledge is limited. Imagination encircles the world.";
        }
        
        // Add response to conversation
        addAgentMessage(response);
        setIsResponding(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsResponding(false);
    }
  };

  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute left-1/2 transform -translate-x-1/2" style={{ top: "85%" }}>
        {conversationState === "initial" && (
          <Button
            onClick={startConversation}
            className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs"
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
              className="bg-transparent border border-white/30 text-white/70 w-[320px] py-2.5 tracking-wide uppercase flex items-center justify-center text-xs"
            >
              <Mic className="h-5 w-5 mr-2" />
              <span>SPEAK WITH EINSTEIN</span>
            </Button>
          </div>
        )}
        
        {conversationState === "ready" && (
          <div className="flex flex-col items-center">
            <p className="text-white text-center text-2xl mb-2">
              Ready to answer your questions
            </p>
            <p className="text-white/80 text-center text-sm mb-6">
              Click the button below to ask a question
            </p>
            
            <Button
              onClick={() => setShowQuestionModal(true)}
              className="bg-transparent border border-white/30 text-white w-[320px] py-2.5 tracking-wide uppercase hover:bg-white/10 transition-all duration-200 flex items-center justify-center text-xs"
              disabled={isResponding}
            >
              <Mic className="h-5 w-5 mr-2" />
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