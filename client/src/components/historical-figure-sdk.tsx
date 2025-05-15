import { useRef, useState, useEffect } from "react";
import { getHistoricalFigureById } from "@/data/historical-figures";
import { EinsteinSdkVoice } from "@/components/einstein-sdk-voice";
import { useConversation } from "@/context/conversation-context";

interface HistoricalFigureProps {
  figureId: string;
}

export function HistoricalFigureSdk({ figureId }: HistoricalFigureProps) {
  const figure = getHistoricalFigureById(figureId);
  const { isResponding } = useConversation();
  
  // Background image reference
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const backgroundRef = useRef<HTMLImageElement>(null);
  
  // Handle background image loading
  useEffect(() => {
    if (backgroundRef.current) {
      // If the image is already loaded from cache, mark as loaded
      if (backgroundRef.current.complete) {
        setBackgroundLoaded(true);
      } else {
        // Otherwise, wait for the load event
        const handleLoad = () => setBackgroundLoaded(true);
        backgroundRef.current.addEventListener('load', handleLoad);
        return () => {
          backgroundRef.current?.removeEventListener('load', handleLoad);
        };
      }
    }
  }, []);

  if (!figure) {
    return <div className="text-center">Historical figure not found</div>;
  }

  return (
    <div className="w-full h-screen flex flex-col relative overflow-hidden">
      {/* Background Image - Full height and width */}
      <img
        ref={backgroundRef}
        src={figure.imageSrc}
        alt={figure.name}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity: backgroundLoaded ? 1 : 0, transition: 'opacity 0.3s ease-in-out' }}
      />
      
      {/* Overlay to darken the background slightly */}
      <div className="absolute inset-0 bg-black/15"></div>
      
      {/* Header with HISTORAI branding */}
      <div className="relative z-10 p-6 flex justify-between items-center">
        <div className="text-white font-semibold text-2xl tracking-wider">HISTORAI</div>
      </div>
      
      {/* Content area */}
      <div className="relative z-10 flex-grow flex flex-col justify-between items-center">
        {/* Here we render the EinsteinSdkVoice component which handles the conversation */}
        <EinsteinSdkVoice figureId={figureId} />
        
        {/* Status indicator (optional) */}
        {isResponding && (
          <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2">
            <div className="text-white text-sm bg-black/40 px-4 py-1 rounded-lg">
              Listening...
            </div>
          </div>
        )}
      </div>
    </div>
  );
}