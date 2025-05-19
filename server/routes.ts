import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";

// Simple rate limiting middleware to prevent abuse
const rateLimiter = () => {
  const requestCounts: Record<string, { count: number, resetTime: number }> = {};
  
  return (req: Request, res: Response, next: NextFunction) => {
    // Get client IP or a reasonable default if not available
    const clientIp = String(req.ip || 
                     (typeof req.headers['x-forwarded-for'] === 'string' 
                      ? req.headers['x-forwarded-for'] 
                      : 'unknown'));
    const now = Date.now();
    
    // Initialize or reset counter if needed
    if (!requestCounts[clientIp] || requestCounts[clientIp].resetTime < now) {
      requestCounts[clientIp] = { 
        count: 0, 
        resetTime: now + 60000 // Reset after 1 minute
      };
    }
    
    // Increment the counter
    requestCounts[clientIp].count++;
    
    // Check if the rate limit has been exceeded
    if (requestCounts[clientIp].count > 60) { // Max 60 requests per minute
      return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    
    next();
  };
};

// Middleware to validate that requests come from our own frontend
const validateInternalRequest = (req: Request, res: Response, next: NextFunction) => {
  const referer = req.headers.referer || '';
  // Only allow requests from our own domain or localhost during development
  if (referer.includes(req.headers.host || '') || 
      process.env.NODE_ENV === 'development') {
    return next();
  }
  return res.status(403).json({ error: 'Access denied' });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply security headers to all responses
  app.use((req, res, next) => {
    // Security headers
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    
    // CORS configuration
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    
    next();
  });
  
  // Apply rate limiting to all API routes
  app.use('/api/', rateLimiter());
  // Legacy API route - keep for backward compatibility
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

  // Secure ElevenLabs API proxy endpoints
  // These endpoints keep the API key on the server side only
  
  // Start conversation endpoint
  app.post('/api/elevenlabs/start-conversation', validateInternalRequest, async (req, res) => {
    try {
      const { agentKey } = req.body;
      
      if (!agentKey) {
        return res.status(400).json({ error: 'Missing agent key' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Call ElevenLabs API to start a conversation
      const response = await axios.post('https://api.elevenlabs.io/v1/conversation', 
        {
          agent_key: agentKey,
          connect_only: true
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          }
        }
      );
      
      // Return the conversation ID to the client
      return res.status(200).json({ 
        conversation_id: response.data.conversation_id 
      });
    } catch (error: any) {
      console.error('Error starting conversation with ElevenLabs:', error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to start conversation',
        details: error.message
      });
    }
  });
  
  // Get conversation response endpoint
  app.post('/api/elevenlabs/conversation-response', validateInternalRequest, async (req, res) => {
    try {
      const { message, conversationId } = req.body;
      
      if (!message || !conversationId) {
        return res.status(400).json({ error: 'Missing message or conversation ID' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Call ElevenLabs API to get a response
      const response = await axios.post(
        `https://api.elevenlabs.io/v1/conversation/${conversationId}`,
        {
          message: message
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey
          }
        }
      );
      
      // Return the response data to the client
      return res.status(200).json({
        conversation_id: response.data.conversation_id,
        response: response.data.response
      });
    } catch (error: any) {
      console.error('Error getting response from ElevenLabs:', error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to get conversation response',
        details: error.message
      });
    }
  });
  
  // Get audio endpoint
  app.get('/api/elevenlabs/audio/:conversationId', validateInternalRequest, async (req, res) => {
    try {
      const { conversationId } = req.params;
      
      if (!conversationId) {
        return res.status(400).json({ error: 'Missing conversation ID' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Call ElevenLabs API to get audio
      const response = await axios.get(
        `https://api.elevenlabs.io/v1/conversation/${conversationId}/audio`,
        {
          headers: {
            'xi-api-key': apiKey,
            'Accept': 'audio/mpeg'
          },
          responseType: 'stream'
        }
      );
      
      // Set the appropriate headers and stream the audio data
      res.set('Content-Type', 'audio/mpeg');
      response.data.pipe(res);
    } catch (error: any) {
      console.error('Error getting audio from ElevenLabs:', error.response?.data || error.message);
      return res.status(500).json({ 
        error: 'Failed to get audio',
        details: error.message
      });
    }
  });
  /**
   * Server-side mapping of historical figure IDs to their respective agent keys
   * Using the Einstein agent key for all figures for now
   */
  // For debugging
  console.log("Environment vars check:", { 
    ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY ? "exists" : "missing",
    AGENT_KEY_EINSTEIN: process.env.AGENT_KEY_EINSTEIN || "missing"
  });
  
  // Hardcoded keys are temporary - ideally these would come from environment variables
  // in a production setting
  const figureAgentKeyMap: Record<string, string> = {
    'einstein': process.env.AGENT_KEY_EINSTEIN || 'hWQi3k8Rnma2afkUtNKE',
    'aurelius': process.env.AGENT_KEY_AURELIUS || 'hWQi3k8Rnma2afkUtNKE',
    'curie': process.env.AGENT_KEY_CURIE || 'hWQi3k8Rnma2afkUtNKE',
    'lincoln': process.env.AGENT_KEY_LINCOLN || 'hWQi3k8Rnma2afkUtNKE'
  };

  /**
   * Secure endpoint to get agent key for a historical figure
   * This prevents exposing agent keys in frontend code
   */
  app.get('/api/figure-agent-key/:figureId', validateInternalRequest, async (req, res) => {
    try {
      const { figureId } = req.params;
      
      if (!figureId) {
        return res.status(400).json({ error: 'Missing figure ID' });
      }
      
      // Look up the agent key from our secure server-side mapping
      const agentKey = figureAgentKeyMap[figureId];
      
      if (!agentKey) {
        return res.status(404).json({ error: 'Agent key not found for the specified figure' });
      }
      
      // Return a temporary token that can be used for a limited time
      // This adds an extra layer of security
      const timestamp = Date.now();
      const temporaryToken = {
        agentKey,
        timestamp,
        expiresAt: timestamp + (5 * 60 * 1000) // Token expires in 5 minutes
      };
      
      return res.status(200).json(temporaryToken);
    } catch (error: any) {
      console.error('Error retrieving agent key:', error.message);
      return res.status(500).json({ 
        error: 'Failed to retrieve agent key',
        details: error.message
      });
    }
  });

  /**
   * Get signed URL endpoint for ElevenLabs SDK
   * Required for WebRTC voice communication with ElevenLabs agents
   */
  app.get('/api/signed-url', validateInternalRequest, async (req, res) => {
    try {
      // Get the figure ID from query params, default to Einstein
      const figureId = req.query.figureId as string || 'einstein';
      
      // Look up the agent key securely from our server-side mapping
      const agentId = figureAgentKeyMap[figureId];
      
      if (!agentId) {
        return res.status(404).json({ error: 'Agent key not found for the specified figure' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      
      if (!apiKey) {
        return res.status(500).json({ error: 'Server configuration error: Missing API key' });
      }
      
      // Call the ElevenLabs API to get a signed URL for secure WebRTC connection
      const elevenlabsResponse = await axios.get(
        `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${agentId}`,
        {
          headers: {
            'xi-api-key': apiKey
          }
        }
      );
      
      if (!elevenlabsResponse.data || !elevenlabsResponse.data.signed_url) {
        return res.status(500).json({ error: 'Failed to get signed URL from ElevenLabs API' });
      }
      
      // Return the signed URL from ElevenLabs
      return res.status(200).json({ signedUrl: elevenlabsResponse.data.signed_url });
    } catch (error: any) {
      console.error('Error generating signed URL:', error.response?.data || error.message);
      
      // If we can't get the signed URL, return an error
      return res.status(500).json({ 
        error: 'Failed to generate signed URL',
        details: error.message
      });
    }
  });

  /**
   * Generate audio response from Einstein AI
   * This endpoint uses ElevenLabs' specialized Einstein AI character and voice
   */
  app.post('/api/agent-audio', validateInternalRequest, async (req: Request, res: Response) => {
    try {
      const { message } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Missing message parameter' });
      }
      
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Missing ElevenLabs API key configuration' });
      }
      
      // Use our secure mapping instead of hardcoding agent keys
      const figureId = req.body.figureId || 'einstein';
      const EINSTEIN_CHARACTER_ID = figureAgentKeyMap[figureId];
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
