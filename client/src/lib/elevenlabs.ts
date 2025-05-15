import { getHistoricalFigureById } from "@/data/historical-figures";

// API key
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY;

interface ConversationResponse {
  conversation_id: string;
  response: string;
}

// Create or continue a conversation with ElevenLabs ConversationalAI
export async function startConversation(figureId: string): Promise<string> {
  const figure = getHistoricalFigureById(figureId);
  
  if (!figure) {
    throw new Error(`Historical figure with ID ${figureId} not found`);
  }
  
  if (!figure.agentKey) {
    throw new Error(`No agent key found for ${figure.name}`);
  }
  
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/conversation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        agent_key: figure.agentKey,
        connect_only: true
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} ${errorText}`);
      
      // Fall back to a mock conversation ID if the API fails
      return "mock-conversation-" + Date.now();
    }
    
    const data = await response.json();
    return data.conversation_id;
  } catch (error) {
    console.error('Error starting ElevenLabs conversation:', error);
    // Fall back to a mock conversation ID if the API fails
    return "mock-conversation-" + Date.now();
  }
}

// Function to get a response from the ElevenLabs Conversational AI
export async function getConversationResponse(
  message: string, 
  conversationId: string
): Promise<ConversationResponse> {
  try {
    // Check if we're using a mock conversation (fallback mode)
    if (conversationId.startsWith('mock-conversation')) {
      // In fallback mode, simulate responses
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate appropriate responses based on the message
      let response = "I'm sorry, I don't understand. Can you try asking something else?";
      
      const lowerMessage = message.toLowerCase();
      
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
      
      return {
        conversation_id: conversationId,
        response: response
      };
    }
    
    // Using the real ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/conversation/${conversationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        message: message
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`ElevenLabs API error: ${response.status} ${errorText}`);
      
      // Fallback response
      return {
        conversation_id: conversationId,
        response: "I'm having trouble connecting to my knowledge base. Let me try to answer based on what I know. What would you like to discuss?"
      };
    }
    
    const data = await response.json();
    return {
      conversation_id: data.conversation_id,
      response: data.response
    };
  } catch (error) {
    console.error('Error getting ElevenLabs response:', error);
    return {
      conversation_id: conversationId,
      response: "I'm sorry, I encountered an error processing your question. Please try again."
    };
  }
}

// Function to get audio stream from ElevenLabs
export async function getAudioResponse(conversationId: string): Promise<ReadableStream<Uint8Array> | null> {
  // Skip audio for mock conversations
  if (conversationId.startsWith('mock-conversation')) {
    return null;
  }
  
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/conversation/${conversationId}/audio`, {
      method: 'GET',
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
        'Accept': 'audio/mpeg'
      }
    });
    
    if (!response.ok) {
      console.error(`Failed to get audio: ${response.status}`);
      return null;
    }
    
    return response.body;
  } catch (error) {
    console.error('Error getting audio response:', error);
    return null;
  }
}
