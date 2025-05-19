import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ElevenlabsAgent } from '@/components/elevenlabs-agent';
import { ElevenlabsVoice } from '@/components/elevenlabs-voice';
import { Badge } from '@/components/ui/badge';

/**
 * ElevenLabs Demo Page
 * 
 * This page showcases different integration methods with ElevenLabs Voice AI
 */
export default function Demo() {
  const [demoType, setDemoType] = useState<'agent' | 'voice'>('agent');
  const einsteinId = 'einstein'; // ID for the Einstein figure

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="container mx-auto py-8">
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            ElevenLabs Voice AI Demo
          </h1>
          <p className="mt-2 text-gray-400">
            Interact with Albert Einstein using advanced AI voice technology
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Integration Selector */}
        <div className="mb-12 flex flex-col items-center">
          <h2 className="text-xl mb-4">Choose Integration Method</h2>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => setDemoType('agent')}
              variant={demoType === 'agent' ? 'default' : 'outline'}
              className="min-w-[180px]"
            >
              ElevenLabs SDK
              <Badge className="ml-2 bg-blue-600" variant="secondary">
                Client SDK
              </Badge>
            </Button>
            
            <Button
              onClick={() => setDemoType('voice')}
              variant={demoType === 'voice' ? 'default' : 'outline'}
              className="min-w-[180px]"
            >
              ElevenLabs React
              <Badge className="ml-2 bg-green-600" variant="secondary">
                React Hooks
              </Badge>
            </Button>
          </div>
        </div>

        {/* Integration Description */}
        <div className="mb-8 max-w-2xl mx-auto">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-medium mb-2">
              {demoType === 'agent' 
                ? 'SDK Integration (Web Audio API)' 
                : 'React Hooks Integration'}
            </h3>
            <p className="text-gray-300">
              {demoType === 'agent'
                ? 'This demo uses the ElevenLabs JavaScript SDK directly for full-duplex audio conversation with Einstein. This showcases low-level integration with WebRTC.'
                : 'This demo uses ElevenLabs React Hooks for a simplified integration with React components. This approach uses a higher-level abstraction over the ElevenLabs SDK.'}
            </p>
          </div>
        </div>

        {/* Einstein Interaction Area */}
        <div className="mt-10 border border-gray-700 rounded-lg p-4 h-[500px] flex flex-col items-center justify-center">
          <div className="relative w-full h-full flex flex-col items-center justify-center">
            {/* Einstein image */}
            <div className="mb-8">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Albert_Einstein_Head.jpg/330px-Albert_Einstein_Head.jpg" 
                alt="Albert Einstein"
                className="w-40 h-40 rounded-full object-cover object-center border-4 border-gray-700"
              />
            </div>
            
            {/* Selected integration component */}
            {demoType === 'agent' ? (
              <ElevenlabsAgent figureId={einsteinId} />
            ) : (
              <ElevenlabsVoice figureId={einsteinId} />
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-gray-500">
        <p>Powered by ElevenLabs Voice AI</p>
      </footer>
    </div>
  );
}