import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  // API routes
  app.post('/api/conversation', async (req, res) => {
    try {
      const { message, agentKey } = req.body;
      
      if (!message || !agentKey) {
        return res.status(400).json({ message: 'Missing message or agentKey' });
      }
      
      // In a real implementation, this would forward the request to ElevenLabs API
      // For now, we'll return a predefined response
      const response = await generateEinsteinResponse(message);
      res.status(200).json({ 
        success: true, 
        response,
        conversation_id: 'einstein-' + Date.now() 
      });
    } catch (error) {
      console.error('Error in conversation endpoint:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
  
  /**
   * Get signed URL endpoint for ElevenLabs SDK
   * Required for WebRTC voice communication with ElevenLabs agents
   */
  app.get('/api/signed-url', async (req, res) => {
    try {
      // Get the figure ID from query params, default to Einstein
      const figureId = req.query.figureId as string || 'einstein';
      const agentId = "hWQi3k8Rnma2afkUtNKE"; // Einstein agent key
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        throw new Error('Missing ElevenLabs API key');
      }
      
      // According to the docs, we need to call the ElevenLabs API to get a signed URL
      const elevenlabsResponse = await axios.get(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          headers: {
            'xi-api-key': apiKey
          }
        }
      );
      
      if (!elevenlabsResponse.data || !elevenlabsResponse.data.signed_url) {
        throw new Error('Failed to get signed URL from ElevenLabs API');
      }
      
      // Return the signed URL from ElevenLabs
      res.status(200).json({ signedUrl: elevenlabsResponse.data.signed_url });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      
      // If we can't get the signed URL, provide fallback information
      try {
        // Fallback to simple JSON object with agent ID
        res.status(200).json({ 
          signedUrl: JSON.stringify({
            agentId: "hWQi3k8Rnma2afkUtNKE" // Einstein agent key
          })
        });
      } catch (fallbackError) {
        res.status(500).json({ message: 'Failed to generate signed URL' });
      }
    }
  });

  /**
   * Generate audio response from Einstein AI
   * This endpoint uses ElevenLabs' specialized Einstein AI character and voice
   */
  app.post('/api/agent-audio', async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Missing message parameter' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Missing ElevenLabs API key configuration' });
      }
      
      // ElevenLabs' special Einstein character and voice IDs
      const EINSTEIN_CHARACTER_ID = "hWQi3k8Rnma2afkUtNKE";
      const EINSTEIN_VOICE_ID = "ZQe5CZNOzWyzPSCn5a3c";
      
      // Generate a unique conversation ID
      const conversationId = `einstein-${Date.now()}`;
      
      // Step 1: Get AI response from ElevenLabs' Character API
      const aiResponse = await axios.post(
        'https://api.elevenlabs.io/v1/chat',
        {
          character_id: EINSTEIN_CHARACTER_ID,
          history: [
            { 
              role: 'system', 
              content: 'You are Albert Einstein, the brilliant physicist known for the theory of relativity.'
            },
            { 
              role: 'user', 
              content: message 
            }
          ],
          model_id: "eleven_multilingual_v2"
        }, 
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          }
        }
      );
      
      // Extract the text response
      const textResponse = aiResponse.data.response || aiResponse.data.text || aiResponse.data.content || 
        "I'm sorry, I couldn't process that question at the moment.";
      
      // Step 2: Generate audio using ElevenLabs Text-to-Speech with Einstein's voice
      const speechResponse = await axios.post(
        `https://api.elevenlabs.io/v1/text-to-speech/${EINSTEIN_VOICE_ID}`,
        {
          text: textResponse,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        },
        {
          headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );
      
      // Return successful response with text and audio
      return res.status(200).json({
        conversation_id: conversationId,
        response: textResponse,
        audio: Buffer.from(speechResponse.data).toString('base64')
      });
      
    } catch (error: any) {
      console.error('Error in agent-audio endpoint:', error.message);
      
      // Check if it's an API error with a response
      if (error.response) {
        return res.status(500).json({
          error: 'ElevenLabs API Error',
          details: error.response.data,
          status: error.response.status
        });
      }
      
      // Generic error
      return res.status(500).json({
        error: 'Failed to process request',
        details: error.message
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

// Function to generate Einstein-like responses
async function generateEinsteinResponse(message: string): Promise<string> {
  // Get lowercase version of message for easier matching
  const lowerMessage = message.toLowerCase();
  
  // Match different topics with appropriate responses
  if (lowerMessage.includes('relativity') || lowerMessage.includes('space') || lowerMessage.includes('time')) {
    return "Time and space are not conditions in which we live, but modes by which we think. Physical concepts are free creations of the human mind, and are not, however it may seem, uniquely determined by the external world.";
  } 
  else if (lowerMessage.includes('quantum') || lowerMessage.includes('mechanics') || lowerMessage.includes('uncertainty')) {
    return "Quantum mechanics is certainly imposing. But an inner voice tells me that it is not yet the real thing. The theory says a lot, but does not really bring us any closer to the secret of the 'old one'.";
  }
  else if (lowerMessage.includes('god') || lowerMessage.includes('religion') || lowerMessage.includes('believe')) {
    return "I believe in Spinoza's God who reveals himself in the orderly harmony of what exists, not in a God who concerns himself with the fates and actions of human beings.";
  }
  else if (lowerMessage.includes('imagination') || lowerMessage.includes('creativity') || lowerMessage.includes('knowledge')) {
    return "Imagination is more important than knowledge. For knowledge is limited, whereas imagination embraces the entire world, stimulating progress, giving birth to evolution.";
  }
  else if (lowerMessage.includes('peace') || lowerMessage.includes('war') || lowerMessage.includes('atom') || lowerMessage.includes('nuclear')) {
    return "Peace cannot be kept by force; it can only be achieved by understanding. The release of atom power has changed everything except our way of thinking.";
  }
  else if (lowerMessage.includes('education') || lowerMessage.includes('school') || lowerMessage.includes('learn') || lowerMessage.includes('teaching')) {
    return "Education is what remains after one has forgotten what one has learned in school. The only thing that interferes with my learning is my education.";
  }
  else if (lowerMessage.includes('success') || lowerMessage.includes('fail') || lowerMessage.includes('mistake')) {
    return "A person who never made a mistake never tried anything new. Success is failure in progress.";
  }
  else {
    return "The important thing is not to stop questioning. Curiosity has its own reason for existing. One cannot help but be in awe when contemplating the mysteries of eternity, of life, of the marvelous structure of reality.";
  }
}
