import { FigureNavigation } from "@/components/figure-navigation";
import { ConvAI } from "@/components/convai-component";
import { ChatHistoryPanel } from "@/components/chat-history-panel";
import { useConversation } from "@/context/conversation-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

/**
 * Home page component
 * Displays the main interface for interacting with historical figures
 */
export default function Home() {
  const { currentFigureId } = useConversation();

  return (
    <div className="relative min-h-screen w-full bg-[#0d131f] overflow-hidden">
      {/* Full-screen background image */}
      <div className="absolute inset-0 w-full h-full z-0">
        <img 
          src="https://res.cloudinary.com/dorfwjwze/image/upload/v1747172515/Albert-Echo-Expanded_acpmte.png"
          alt="Background" 
          className="w-full h-full object-cover"
        />
      </div>
      
      {/* App Header with logo - positioned at the top */}
      <header className="absolute top-0 left-0 right-0 flex items-center justify-center px-10 py-6 bg-transparent z-20">
        <div className="flex items-center">
          <h1 className="text-xl font-light tracking-widest text-white uppercase letter-spacing-wide">HISTORAI</h1>
        </div>
      </header>

      {/* Left sidebar with navigation icons */}
      <FigureNavigation />
      
      {/* Main content area - transparent overlay */}
      <div className="relative z-10 flex flex-col items-center justify-end w-full min-h-screen pb-20">
        <ConvAI figureId={currentFigureId} />
      </div>

      {/* Chat history panel */}
      <ChatHistoryPanel />
    </div>
  );
}
