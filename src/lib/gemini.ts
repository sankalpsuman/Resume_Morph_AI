import { GoogleGenAI, GenerateContentResponse, Type } from "@google/genai";

// Helper to extract JSON from a string that might contain extra text
function extractJson(text: string): string {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  const firstBracket = text.indexOf('[');
  const lastBracket = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  // Determine if we are looking for an object or an array based on what comes first
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1 && end !== -1 && end > start) {
    return text.substring(start, end + 1);
  }
  
  return text.trim();
}

// Support multiple API keys for rotation
const getApiKeys = () => {
  const envKeys = [
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined),
    (typeof process !== 'undefined' ? process.env?.API_KEY : undefined),
    ((import.meta as any).env?.VITE_GEMINI_API_KEY),
    (window as any).GEMINI_API_KEY
  ].filter(Boolean) as string[];

  // If user has multiple keys in a comma-separated string
  const splitKeys = envKeys.flatMap(k => k.split(',').map(s => s.trim()));
  return [...new Set(splitKeys)];
};

let currentKeyIndex = 0;

async function withRetry<T>(fn: (ai: GoogleGenAI) => Promise<T>, retries = 2): Promise<T> {
  const keys = getApiKeys();
  
  if (keys.length === 0) {
    // Check if window.aistudio is available as a last resort
    const hasKey = await (window as any).aistudio?.hasSelectedApiKey?.();
    if (!hasKey) {
      throw new Error("API_KEY_MISSING");
    }
    // If aistudio has a key, it's usually injected into process.env.API_KEY or similar
    // but if we are here, it means the above check failed to find it.
    // We'll throw and let the UI handle the key selection.
    throw new Error("API_KEY_MISSING");
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    const apiKey = keys[currentKeyIndex];
    const ai = new GoogleGenAI({ apiKey });

    try {
      return await fn(ai);
    } catch (error: any) {
      const isQuotaError = error?.message?.includes("429") || error?.message?.toLowerCase().includes("quota");
      
      if (isQuotaError) {
        // Rotate key
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        
        // If we've tried all keys, wait or throw
        if (attempt === retries || (attempt >= keys.length - 1)) {
          throw new Error("QUOTA_EXCEEDED");
        }
        
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }
      
      throw error;
    }
  }
  throw new Error("MAX_RETRIES_REACHED");
}

export async function analyzeLayout(fileBase64?: string, mimeType?: string, rawText?: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Analyze the layout of this resume. 
    ${rawText ? `The following text was extracted from a document: \n\n${rawText}\n\nBased on the structure of this text, infer and describe:` : "Describe in detail based on the provided file:"}
    1. Typography (font styles, weights, sizes for headers vs body).
    2. Layout (single column, double column, sidebar, margins, spacing).
    3. Visual elements (lines, icons, colors, bullet points style).
    4. Section organization (how sections like Experience, Education, Skills are visually separated).
    
    Provide a structured description that can be used to recreate this style in HTML/Tailwind CSS.`;

    const contents: any[] = [];
    if (fileBase64 && mimeType) {
      contents.push({
        parts: [
          { inlineData: { data: fileBase64, mimeType } },
          { text: prompt }
        ]
      });
    } else if (rawText) {
      contents.push({
        parts: [{ text: prompt }]
      });
    } else {
      throw new Error("No input provided for layout analysis");
    }

    const response = await ai.models.generateContent({
      model,
      contents,
    });

    return response.text;
  });
}

export async function extractTextFromAny(base64: string, mimeType: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    const prompt = "Extract all the text content from this resume precisely. Do not add any commentary.";
    const part = { inlineData: { data: base64, mimeType } };
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [part, { text: prompt }] }],
    });
    return response.text;
  });
}

export async function getOptimizationPlan(userContent: string, jobDescription?: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Expert ATS Strategist.
    
    CONTENT: ${userContent}
    TARGET: ${jobDescription || "Standard High-Level Professional"}
    
    TASK: Propose specific changes to make this resume 100% ATS friendly.
    
    RULES:
    1. List 3-5 high-impact changes.
    2. Focus on: Keyword alignment, Heading standardization, Bullet point rephrasing, and Structure.
    3. Be concise.
    
    OUTPUT: JSON array of strings.
    
    Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1
      },
      contents: [{ parts: [{ text: prompt }] }],
    });

    try {
      const text = extractJson(response.text);
      return JSON.parse(text);
    } catch (e) {
      return ["Standardize headings", "Optimize keyword density", "Improve bullet point structure"];
    }
  });
}

export async function generateResume(layoutDesc: string, userContent: string, jobDescription?: string, maximizeAts: boolean = false) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const optimizationPrompt = jobDescription 
      ? `\n\nOPTIMIZATION TARGET:\n${jobDescription}\n\nRULES:
      1. Align USER CONTENT to target.
      2. PRESERVE all original details.
      3. Only add details that help match requirements truthfully.
      4. Focus on keywords and emphasis.`
      : "";

    const atsMaxPrompt = maximizeAts 
      ? `\n\nCRITICAL: MAXIMIZE ATS SCORE TO 100%. 
      - Prioritize standard structure and keyword density over complex visual styling.
      - Use the most standard headings.
      - Ensure 100% parseability.
      - Set "atsScore" to 100.`
      : "";

    const prompt = `Expert ATS Resume Builder.
    
    LAYOUT: ${layoutDesc}
    CONTENT: ${userContent}${optimizationPrompt}${atsMaxPrompt}
    
    TASK:
    1. Generate professional HTML/Tailwind resume matching LAYOUT.
    2. If OPTIMIZATION TARGET exists, align content strictly.
    3. Extract Name, YOE, Profile.
    4. Calculate ATS Score (0-100).
    
    ATS RULES: Standard headings, linear structure, no complex CSS hacks, searchable text.
    
    METADATA: "name", "yoe", "profile" (use underscores).
    
    OUTPUT: JSON object with:
    - "html": HTML string (Tailwind only).
    - "name": Full name.
    - "yoe": Years of experience.
    - "profile": Job title.
    - "atsScore": 0-100.
    - "atsFeedback": Max 150 chars.
    
    Return ONLY JSON. No markdown.`;

    const response = await ai.models.generateContent({
      model,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            html: { type: Type.STRING },
            name: { type: Type.STRING },
            yoe: { type: Type.STRING },
            profile: { type: Type.STRING },
            atsScore: { type: Type.NUMBER },
            atsFeedback: { type: Type.STRING }
          },
          required: ["html", "name", "yoe", "profile", "atsScore", "atsFeedback"]
        },
        temperature: 0.1 // Lower temperature for faster, more consistent results
      },
      contents: [{ parts: [{ text: prompt }] }],
    });

    try {
      const text = extractJson(response.text);
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response as JSON", e);
      // Fallback if JSON parsing fails
      return { html: response.text, name: "Resume", yoe: "0", profile: "Profile", atsScore: 0, atsFeedback: "Parsing error" };
    }
  });
}

export async function checkMatch(resumeText: string, jobDescription: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Expert ATS Matcher.
    
    RESUME: ${resumeText}
    JOB DESCRIPTION: ${jobDescription}
    
    TASK:
    1. Extract 10-15 key technical and soft skills from the JOB DESCRIPTION.
    2. Check if they exist in the RESUME (consider synonyms).
    3. Calculate a Match Score (0-100).
    4. List MISSING keywords.
    
    OUTPUT: JSON object with:
    - "score": number (0-100).
    - "missing": array of strings.
    
    Return ONLY JSON.`;

    const response = await ai.models.generateContent({
      model,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            missing: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["score", "missing"]
        },
        temperature: 0.1
      },
      contents: [{ parts: [{ text: prompt }] }],
    });

    try {
      const text = extractJson(response.text);
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse match response", e);
      return { score: 0, missing: [] };
    }
  });
}
