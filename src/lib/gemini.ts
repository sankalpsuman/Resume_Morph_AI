import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

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
    
    const prompt = `Expert Visual DNA Analyst.
    
    TASK: Analyze the visual structure of this resume to extract its "Layout DNA".
    
    ${rawText ? `EXTRACTED TEXT: \n\n${rawText}\n\nBased on this text structure, infer:` : "Based on the provided file, describe:"}
    
    1. TYPOGRAPHY: Font pairings (serif/sans), weights (bold/light), and precise size hierarchy (headers vs body).
    2. LAYOUT ARCHITECTURE: Column structure (single, 2/3 split, sidebar left/right), margins, and vertical/horizontal spacing patterns.
    3. DESIGN LANGUAGE: Visual accents (lines, icons, color palette hex codes if visible, bullet point styles).
    4. SECTION LOGIC: How sections (Experience, Education, etc.) are visually demarcated (borders, background colors, spacing).
    
    OUTPUT: Provide a concise, highly technical description optimized for a developer to recreate using Tailwind CSS. Focus on structural patterns.`;

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
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
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
      config: {
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
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
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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

export async function generateResume(
  reference: { base64?: string; mimeType?: string; text?: string },
  content: { base64?: string; mimeType?: string; text?: string },
  jobDescription: string = "",
  maximizeAts: boolean = false,
  existingLayout: string | null = null,
  strict: boolean = true
) {
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

    const strictPrompt = strict 
      ? `\n\nSTRICT MODE ENABLED:
      - Replicate the EXACT layout, composition, and proportions of the REFERENCE.
      - Do NOT move sections, do NOT change the order of elements.
      - Keep EXACT subject position and proportions (e.g., sidebar width, header height).
      - Do NOT "reimagine" or "optimize" the layout structure. Mirror it perfectly.
      - Preserve the original's section organization and visual hierarchy.`
      : "";

    const prompt = `Expert Structural Architect & Visual Mirror.
    
    TASK:
    1. STRUCTURAL MIRROR: Replicate the EXACT layout, composition, and proportions of the REFERENCE RESUME. The output HTML must be a structural clone.
    2. CONTENT MAPPING: Map the USER CONTENT into this EXACT structure. Do NOT move sections, do NOT change the order of elements, and do NOT add or remove structural components unless explicitly requested.
    3. STYLE APPLICATION: Apply the visual style (fonts, colors, spacing, accents) of the REFERENCE while maintaining the original's structural integrity.
    
    ${strictPrompt}
    
    STRICT RULES (MANDATORY):
    - Keep EXACT same layout and composition as the reference.
    - Keep EXACT subject position and proportions.
    - Do NOT "reimagine" or "optimize" the layout structure. Mirror it.
    - Preserve the original's section organization and visual hierarchy.
    - Use clean, semantic Tailwind CSS classes.
    
    ${optimizationPrompt}${atsMaxPrompt}
    
    QUALITY CONTROLS:
    - Sharp, high-quality layout.
    - Clean edges and consistent spacing.
    - Professional typography pairings.
    
    OUTPUT: JSON object with:
    - "html": Complete HTML string (Tailwind only).
    - "name": Full name.
    - "yoe": Years of experience.
    - "profile": Target job title.
    - "atsScore": 0-100.
    - "atsFeedback": Max 150 chars.
    - "matchScore": 0-100.
    - "missingKeywords": Array of strings.
    - "layoutAnalysis": Concise summary of the mirrored structure.
    - "extractedText": Full text from USER CONTENT.
    
    Return ONLY JSON.`;

    const contents: any[] = [];
    const parts: any[] = [];

    // Add Reference Info
    if (existingLayout) {
      parts.push({ text: `EXISTING LAYOUT ANALYSIS: ${existingLayout}` });
    } else if (reference.text) {
      parts.push({ text: `REFERENCE RESUME TEXT: ${reference.text}` });
    } else if (reference.base64 && reference.mimeType) {
      parts.push({ inlineData: { data: reference.base64.split(',')[1] || reference.base64, mimeType: reference.mimeType } });
      parts.push({ text: "REFERENCE RESUME (Analyze this layout)" });
    }

    // Add Content Info
    if (content.text) {
      parts.push({ text: `USER CONTENT TEXT: ${content.text}` });
    } else if (content.base64 && content.mimeType) {
      parts.push({ inlineData: { data: content.base64.split(',')[1] || content.base64, mimeType: content.mimeType } });
      parts.push({ text: "USER CONTENT (Extract details from this)" });
    }

    // Add JD
    if (jobDescription) {
      parts.push({ text: `JOB DESCRIPTION: ${jobDescription}` });
    }

    // Add Final Prompt
    parts.push({ text: prompt });

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
            atsFeedback: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            missingKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            layoutAnalysis: { type: Type.STRING },
            extractedText: { type: Type.STRING }
          },
          required: ["html", "name", "yoe", "profile", "atsScore", "atsFeedback", "matchScore", "missingKeywords", "layoutAnalysis", "extractedText"]
        },
        temperature: 0.0,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
      contents: [{ parts }],
    });

    try {
      const text = extractJson(response.text);
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response as JSON", e);
      return { 
        html: response.text, 
        name: "Resume", 
        yoe: "0", 
        profile: "Profile", 
        atsScore: 0, 
        atsFeedback: "Parsing error",
        matchScore: 0,
        missingKeywords: [],
        layoutAnalysis: "Error parsing layout",
        extractedText: ""
      };
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
        temperature: 0.1,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
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
