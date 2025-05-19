# HistorAI: A Voice-First Learning Assistant
**By Annette Lapham**

## Overview
**HistorAI** is a voice-first learning experience built with ElevenLabs’ Conversational AI and reimagines education by allowing learners to engage directly in spoken conversation with iconic historical figures—starting with **Albert Einstein**.

This immersive single-page application eliminates the need for traditional text interfaces, creating a truly conversational learning environment. The project showcases how voice AI can personalize education through natural dialogue.

## Features
- 🎙️ **Voice-First Interface**: No text inputs—just talk to your virtual instructor.
- 🧠 **Albert Einstein Persona**: Driven by ElevenLabs Conversational AI Agent trained on Einstein’s life and ideas.
- 📚 **Historical Cast**: Navigation allows switching between other icons like Marcus Aurelius, Marie Curie, and Abraham Lincoln (future expansion).
- 🧬 **Custom Voice Design**: Einstein's voice created using ElevenLabs’ Voice Design tool to reflect his tone and cadence (without using training data from real voice).
- 🖼️ **Custom Character Visuals**: Created via a blend of public domain images, Artbreeder, and Playground AI, with final polish in Photoshop Gerative Fill.
- ⚙️ **Built with V0.dev, Replit & Windsurf**: Originally forked from the [ElevenLabs Conversational AI Starter](https://v0.dev/community/eleven-labs-conversational-ai-starter-5TN93pl3bRS) then moved to Replit for greater design control and extensibility and Windsurf for greater security code quality.

## How to Run Locally

### 1. Download
Download this repository and unzip it.

### 2. Set Up Environment Variables
Inside your project environment (either locally or in Replit):

#### Required Variables:
- `ELEVENLABS_API_KEY` – Get this from your ElevenLabs [Profile Settings](https://elevenlabs.io/app/settings/api-keys)
- `ELEVENLABS_AGENT_ID` – After creating your agent in the [Conversational AI dashboard](https://elevenlabs.io/app/conversational-ai/agents) copy the Agent ID here.

#### V0.dev users:
Go to **Integrations → Environment Variables** and add both of these.

### 3. Run the Project
If using a local React/Next.js setup:

```bash
npm install
npm run dev
```

Otherwise, just run it on Replit or V0.dev using the built-in play button.

## Demo Video
Please refer to the attached 2 minute video (`historai-demo.mp4`) for a walkthrough of the app and its conversational features with Albert Einstein.

## Security Improvements
The application now includes several security enhancements:

1. **API Key Security**
   - API keys are securely stored in `.env` files
   - No API keys exposed in client-side code
   - Server-side proxy for all API calls
   - `.env` file properly gitignored

2. **API Security**
   - Secure endpoints with proper authentication
   - Rate limiting through server proxy
   - Input validation on all API endpoints
   - Error handling with fallback mechanisms

3. **Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - X-XSS-Protection: 1; mode=block
   - Strict-Transport-Security: max-age=31536000
   - Proper CORS configuration

4. **Authentication & Sessions**
   - Secure session management with express-session
   - MemStore for session storage
   - Passport authentication
   - Secure cookie handling

5. **Data Protection**
   - HTTPS for all API communications
   - Input sanitization
   - Secure error handling
   - Logging for security events

## Future Enhancements
Given more time, these are the next planned upgrades:
- **Real-time Talking Head Integration** using D-ID real-time API to visually animate character speech.
- **Personalized Instruction**: Ask the user about their current knowledge level to adapt how the character teaches them (e.g., “explain like I’m 12”).
- **More Historical Figures** with full conversations and matching voices.
- **Real-Time Concept Visuals** to support conversational topics to increase engegement, while still keeping it a 2 person conversation.
- **Hedra Video Intro** to increase initial imersion and attachment, leading into conversational experience.

## Time Spent
Approximately **4 hours**, including setup, customization, visual design, and voice tuning.

## Acknowledgments
- ElevenLabs Conversational AI
- V0.dev Starter Template
- Replit Design Tool
- Windsurf for code quality
- D-ID Real-Time API (planned integration)
- Artbreeder, Playground AI, Photoshop, Hedra (for character visuals)