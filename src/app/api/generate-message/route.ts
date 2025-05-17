import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Keep track of API keys and their usage
interface ApiKeyState {
  key: string
  usageCount: number
  lastUsed: number
}

let apiKeys: ApiKeyState[] = []
let currentKeyIndex = 0

// Constants for key rotation
const MAX_USES_PER_KEY = 950 // Increased to 950 uses per key
const KEY_COOLDOWN = 60 * 1000 // 1 minute cooldown
const MIN_KEYS = 1 // Minimum number of keys to maintain

// Load API keys from environment variables
function loadApiKeysFromEnv() {
  if (apiKeys.length > 0) return; // Already loaded
  
  const envKeys = process.env.GEMINI_API_KEYS || '';
  const keyList = envKeys.split(',').map(k => k.trim()).filter(k => k.length > 0);
  
  if (keyList.length === 0) {
    console.error('No API keys found in GEMINI_API_KEYS environment variable');
    return;
  }
  
  console.log(`Loaded ${keyList.length} API keys from environment variables`);
  apiKeys = keyList.map(key => ({
    key,
    usageCount: 0,
    lastUsed: 0
  }));
}

async function getNextApiKey(): Promise<string> {
  // Ensure we have API keys loaded
  loadApiKeysFromEnv();
  
  if (apiKeys.length === 0) {
    throw new Error('No API keys available. Please add keys to GEMINI_API_KEYS in .env.local');
  }
  
  const now = Date.now();
  
  // Find the least recently used key that hasn't exceeded usage limits
  let selectedIndex = 0;
  let lowestUsage = Infinity;
  
  for (let i = 0; i < apiKeys.length; i++) {
    const keyState = apiKeys[i];
    
    // Reset usage count if cooldown period has passed
    if ((now - keyState.lastUsed) > KEY_COOLDOWN) {
      keyState.usageCount = 0;
    }
    
    if (keyState.usageCount < lowestUsage) {
      lowestUsage = keyState.usageCount;
      selectedIndex = i;
    }
  }
  
  // Update the selected key's usage
  apiKeys[selectedIndex].usageCount++;
  apiKeys[selectedIndex].lastUsed = now;
  
  console.log(`Using API key ${selectedIndex + 1}/${apiKeys.length}, usage count: ${apiKeys[selectedIndex].usageCount}`);
  return apiKeys[selectedIndex].key;
}

// For testing/debugging
export async function GET() {
  try {
    loadApiKeysFromEnv();
    
    return NextResponse.json({
      keys: apiKeys.map(k => ({
        keyPreview: `${k.key.slice(0, 5)}...${k.key.slice(-5)}`,
        usageCount: k.usageCount,
        lastUsed: new Date(k.lastUsed).toISOString(),
        isExpired: (Date.now() - k.lastUsed) > KEY_COOLDOWN && k.usageCount >= MAX_USES_PER_KEY
      })),
      currentKeyIndex,
      totalKeys: apiKeys.length
    });
  } catch (error) {
    console.error('Error in GET handler:', error);
    return NextResponse.json({
      error: 'Failed to manage API keys',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { object } = await request.json();
    
    // Get next available API key
    const apiKey = await getNextApiKey();
    
    // Initialize Gemini with the key
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are a witty and playful AI that gives objects personality. Generate a short, funny message (max 100 characters) as if you were a ${object}. Be creative and playful! Include emojis when appropriate.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const message = response.text();
    
    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error in POST handler:', error);
    return NextResponse.json(
      { error: 'Failed to generate message', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 