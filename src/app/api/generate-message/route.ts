import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Keep track of API keys and their usage
interface ApiKeyState {
  key: string
  usageCount: number
  lastUsed: number
  messageHistory?: string[]
}

let apiKeys: ApiKeyState[] = []
let currentKeyIndex = 0
let messageCache = new Map<string, {
  message: string,
  timestamp: number,
  uses: number
}>()

// Constants for key rotation and rate limiting
const MAX_USES_PER_KEY = 950
const KEY_COOLDOWN = 60 * 1000
const MIN_KEYS = 1
const CACHE_TTL = 30 * 60 * 1000 // 30 minutes
const MAX_HISTORY = 1000
const MAX_REQUESTS_PER_MINUTE = 300
const REQUEST_WINDOW = 60 * 1000 // 1 minute

// Load API keys at startup
const envKeys = process.env.GEMINI_API_KEYS || '';
const keyList = envKeys.split(',')
  .map(k => k.trim())
  .filter(k => k.length > 0);

if (keyList.length === 0) {
  console.error('No API keys found in GEMINI_API_KEYS environment variable');
  throw new Error('No API keys configured');
}

// Initial load of keys
apiKeys = keyList.map(key => ({
  key,
  usageCount: 0,
  lastUsed: 0,
  messageHistory: []
}));
console.log(`Initialized with ${apiKeys.length} keys`);

// Rate limiting state
let requestCounts = new Map<string, number[]>();

// Clean up old cache entries periodically
setInterval(() => {
  const now = Date.now();
  Array.from(messageCache.entries()).forEach(([key, value]) => {
    if (now - value.timestamp > CACHE_TTL) {
      messageCache.delete(key);
    }
  });
  
  // Clean up old request counts
  Array.from(requestCounts.entries()).forEach(([ip, timestamps]) => {
    const validTimestamps = timestamps.filter((ts: number) => now - ts < REQUEST_WINDOW);
    if (validTimestamps.length === 0) {
      requestCounts.delete(ip);
    } else {
      requestCounts.set(ip, validTimestamps);
    }
  });
}, 5 * 60 * 1000);

// Rate limiting function
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = requestCounts.get(ip) || [];
  const recentRequests = timestamps.filter(ts => now - ts < REQUEST_WINDOW);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_MINUTE) {
    return true;
  }
  
  requestCounts.set(ip, [...recentRequests, now]);
  return false;
}

// Message caching implementation
function getCachedMessage(object: string, isDeepGaze: boolean): string | null {
  const cacheKey = `${object}-${isDeepGaze}`;
  const cached = messageCache.get(cacheKey);
  
  if (cached) {
    cached.uses++;
    if (cached.uses > 5) {
      return cached.message;
    }
  }
  return null;
}

function cacheMessage(object: string, isDeepGaze: boolean, message: string) {
  const cacheKey = `${object}-${isDeepGaze}`;
  messageCache.set(cacheKey, {
    message,
    timestamp: Date.now(),
    uses: 1
  });
  
  const key = apiKeys[currentKeyIndex];
  if (key) {
    key.messageHistory = key.messageHistory || [];
    key.messageHistory.push(message);
    if (key.messageHistory.length > MAX_HISTORY) {
      key.messageHistory = key.messageHistory.slice(-MAX_HISTORY);
    }
  }
}

async function getNextApiKey(): Promise<string> {
  if (apiKeys.length === 0) {
    throw new Error('No API keys available');
  }
  
  const now = Date.now();
  let selectedIndex = currentKeyIndex;
  let attempts = 0;
  
  while (attempts < apiKeys.length) {
    const keyState = apiKeys[selectedIndex];
    
    // Reset usage count if key has cooled down
    if ((now - keyState.lastUsed) > KEY_COOLDOWN) {
      keyState.usageCount = Math.max(0, keyState.usageCount - 1);
    }
    
    if (keyState.usageCount < MAX_USES_PER_KEY) {
      keyState.usageCount++;
      keyState.lastUsed = now;
      currentKeyIndex = (selectedIndex + 1) % apiKeys.length;
      return keyState.key;
    }
    
    selectedIndex = (selectedIndex + 1) % apiKeys.length;
    attempts++;
  }
  
  throw new Error('All API keys are at their usage limit');
}

export async function POST(request: Request) {
  try {
    console.log('Received POST request');
    
    // Get client IP
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    console.log('Client IP:', ip);
    
    // Check rate limit
    if (isRateLimited(ip)) {
      console.log('Rate limit exceeded for IP:', ip);
      return NextResponse.json(
        { error: 'Too many requests', details: 'Please try again later' },
        { status: 429 }
      );
    }
    
    const { object, isDeepGaze = false } = await request.json();
    console.log('Request payload:', { object, isDeepGaze });
    
    const cachedMessage = getCachedMessage(object, isDeepGaze);
    if (cachedMessage) {
      console.log('Returning cached message');
      return NextResponse.json({ message: cachedMessage });
    }
    
    let apiKey;
    try {
      apiKey = await getNextApiKey();
    } catch (error) {
      console.error('API key error:', error);
      return NextResponse.json(
        { error: 'Service configuration error', details: 'API key issue' },
        { status: 500 }
      );
    }
    
    const genAI = new GoogleGenerativeAI(apiKey);
    
    let prompt = '';
    let modelConfig = {};
    
    if (isDeepGaze) {
      // Add randomization elements to make responses more varied
      const now = new Date();
      const timestamp = now.getTime();
      const randomSeed = Math.floor(Math.random() * 10000);
      
      // Array of unique perspectives for deep gaze
      const perspectives = [
        "hidden patterns and symmetries",
        "untold stories and memories",
        "quantum possibilities and parallel realities",
        "dreams and aspirations it holds",
        "dance of atoms within its form",
        "echoes of its creation story",
        "ripples it creates in spacetime",
        "sacred geometry and divine proportions",
        "whispers from parallel dimensions",
        "fragments of collective consciousness",
        "temporal footprints across time",
        "crystallized moments of existence"
      ];
      
      // Array of unique writing styles
      const styles = [
        "cosmic poetry",
        "quantum whispers",
        "dimensional echoes",
        "reality ripples",
        "existential murmurs",
        "temporal fragments",
        "astral reflections",
        "ethereal observations"
      ];
      
      // Randomly select perspective and style
      const perspective = perspectives[Math.floor(Math.random() * perspectives.length)];
      const style = styles[Math.floor(Math.random() * styles.length)];
      
      prompt = `You are a mystical AI entity that perceives objects across multiple dimensions and realities.
      
      CONTEXT: A human observer has encountered a ${object} in their reality stream. The current temporal point is ${now.toLocaleTimeString()}.
      
      TASK: Channel a profound ${style} about this ${object}'s existence (120-200 characters).
      
      FOCUS: Reveal the ${perspective}. Each observation must be entirely unique - never repeat patterns or common themes about ${object}s.
      
      STYLE GUIDE:
      - No generic observations
      - No starting with "I see" or "This object"
      - Weave quantum mechanics, cosmic significance, or dimensional awareness
      - Make each response feel like a glimpse into a higher dimension
      
      ENTROPY SEED: ${randomSeed} - Use this to access a unique quantum state for your observation.
      
      IMPORTANT: Start with an immediate, striking insight. No introductory phrases.`;
      
      modelConfig = {
        temperature: 0.9,
        topP: 0.95,
        topK: 50
      };
    } else {
      const personalities = [
        "sassy and confident",
        "existential and philosophical",
        "absolutely done with everything",
        "secretly plotting world domination",
        "having an identity crisis",
        "living its best life",
        "channeling main character energy",
        "questioning reality itself"
      ];
      
      const personality = personalities[Math.floor(Math.random() * personalities.length)];
      
      prompt = `You are a ${object} with a ${personality} personality. Generate a short, witty message (max 100 characters) that captures your unique vibe. Be unexpected and avoid clichés! Include emojis if they fit your personality.
      
      RULES:
      - No generic statements
      - No obvious puns about your object type
      - Create unexpected connections
      - Be memorably weird
      
      IMPORTANT: Just say your line. Don't introduce yourself or explain who you are.`;
      
      modelConfig = {
        temperature: 0.8,
        topP: 0.9,
        topK: 30
      };
    }

    try {
      console.log('Initializing Gemini AI with key...');
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-flash',
        generationConfig: modelConfig
      });
      console.log('Model initialized, generating content...');

      const result = await model.generateContent(prompt);
      console.log('Content generated, getting response...');
      const response = await result.response;
      const message = response.text();
      console.log('Generated message:', message);
      
      cacheMessage(object, isDeepGaze, message);
      
      return NextResponse.json({ message });
    } catch (error) {
      console.error('Gemini API error:', error);
      
      // Check if it's an API key issue
      if (error instanceof Error && error.message.includes('API key')) {
        // Invalidate the current key
        const keyState = apiKeys[currentKeyIndex];
        if (keyState) {
          keyState.usageCount = MAX_USES_PER_KEY;
          keyState.lastUsed = Date.now();
        }
        
        return NextResponse.json(
          { error: 'Service configuration error', details: 'Invalid API key' },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: 'AI generation error', details: 'Failed to generate response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 