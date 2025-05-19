import { useState } from "react";
import { useConversation } from "@/context/conversation-context";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft } from "lucide-react";
import { getHistoricalFigureById } from "@/data/historical-figures";

export function ChatHistoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentFigureId, conversations, clearConversation } = useConversation();
  
  const messages = conversations[currentFigureId] || [];
  const currentFigure = getHistoricalFigureById(currentFigureId);
  
  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Chat history tab button - barely visible notch */}
      <div 
        className="fixed right-0 top-1/2 transform -translate-y-1/2 bg-black/30 backdrop-blur-sm rounded-l-lg p-2 cursor-pointer hover:bg-black/50 transition-all duration-200 shadow-md z-40"
        onClick={togglePanel}
      >
        <ChevronLeft className="h-6 w-6 text-white/80" />
      </div>
      
      {/* Chat history panel */}
      <div className={`chat-history-panel fixed right-0 top-0 bottom-0 w-80 bg-black/40 backdrop-blur-md shadow-xl p-4 z-30 transition-transform duration-300 ease-in-out ${isOpen ? "" : "hidden"}`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium text-white/90">Conversation History</h3>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => clearConversation()}
                className="h-8 px-2 text-xs text-white/70 hover:text-white hover:bg-white/10"
              >
                Clear
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={togglePanel} 
              className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-4">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-center text-sm italic">
                Your conversation with {currentFigure?.name} will appear here.
              </p>
            ) : (
              messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`p-3 rounded-lg backdrop-blur-sm ${
                    message.sender === 'user' 
                      ? 'bg-white/10 ml-8 border border-white/10' 
                      : 'bg-black/30 mr-8 border border-white/5'
                  }`}
                >
                  <div className="text-xs text-white/60 mb-1 font-medium">
                    {message.sender === 'user' ? 'You' : currentFigure?.name}
                  </div>
                  <div className="text-sm text-white/90">{message.text}</div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}
