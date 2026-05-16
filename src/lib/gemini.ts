import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";
import { TOON } from './toon';
import mammoth from 'mammoth';

// Gemini supported multimodal types (Native support)
const AI_SUPPORTED_MIMES = [
  'application/pdf', 
  'image/png', 
  'image/jpeg', 
  'image/webp', 
  'image/heic', 
  'image/heif'
];

// Types that require pre-processing (extraction) before sending to Gemini
const PREPROCESS_MIMES = [
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const SUPPORTED_MIMES = [...AI_SUPPORTED_MIMES, ...PREPROCESS_MIMES];

function isSupportedMime(mime?: string) {
  if (!mime) return false;
  return SUPPORTED_MIMES.includes(mime.toLowerCase());
}

function isNativeAiSupport(mime?: string) {
  if (!mime) return false;
  return AI_SUPPORTED_MIMES.includes(mime.toLowerCase());
}

async function extractDocxText(base64: string): Promise<string> {
  try {
    const data = base64.split(',')[1] || base64;
    const binaryString = atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const result = await mammoth.extractRawText({ arrayBuffer: bytes.buffer });
    return result.value || "";
  } catch (error) {
    console.error("Docx extraction error:", error);
    return "";
  }
}

// Helper to extract DNA from a string that might contain extra text and handle truncation
function extractJson(text: string): string {
  if (!text) return "";
  
  const trimmedText = text.trim();
  
  // If it's already pure JSON, return it
  if ((trimmedText.startsWith('{') && trimmedText.endsWith('}')) || 
      (trimmedText.startsWith('[') && trimmedText.endsWith(']'))) {
    return trimmedText;
  }

  // Next, try to handle markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    const cleaned = markdownMatch[1].trim();
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) return cleaned;
  }

  // Find actual JSON object start
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  // Find actual JSON array start
  const firstBracketMatch = text.match(/\[\s*[\[\{"0-9\-tfn]/);
  const firstBracket = firstBracketMatch ? firstBracketMatch.index! : -1;
  const lastBracket = text.lastIndexOf(']');

  let start = -1;
  let end = -1;

  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    start = firstBrace;
    end = lastBrace;
  } else if (firstBracket !== -1) {
    start = firstBracket;
    end = lastBracket;
  }

  if (start !== -1) {
    // If we have a start but the end is missing or before the start (truncation)
    if (end === -1 || end < start) {
      console.warn("[Gemini AI] JSON appears truncated, attempting repair...");
      let candidate = text.substring(start);
      return repairJson(candidate);
    }

    const candidate = text.substring(start, end + 1).trim();
    // Strict JSON check: must start/end with correct braces and NOT look like TOON [TAG]
    if ((candidate.startsWith('{') && candidate.endsWith('}')) || 
        (candidate.startsWith('[') && candidate.endsWith(']') && !/^\[[A-Z_]+\]/.test(candidate))) {
      return candidate;
    }
    
    // If it looks like JSON but the end brace/bracket was wrong, try repairing
    return repairJson(text.substring(start));
  }
  
  console.warn("[Gemini AI] extractJson failed to find valid JSON start in text of length:", text.length);
  return "";
}

/**
 * Attempts to repair a truncated JSON string by closing open braces and brackets.
 */
function repairJson(json: string): string {
  let stack: string[] = [];
  let inString = false;
  let escaped = false;
  let lastValidChar = -1;

  for (let i = 0; i < json.length; i++) {
    const char = json[i];

    if (inString) {
      lastValidChar = i;
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      lastValidChar = i;
      continue;
    }

    if (char === '{' || char === '[') {
      stack.push(char === '{' ? '}' : ']');
      lastValidChar = i;
    } else if (char === '}' || char === ']') {
      if (stack.length > 0 && stack[stack.length - 1] === char) {
        stack.pop();
        lastValidChar = i;
      }
    } else if (!/\s/.test(char)) {
      lastValidChar = i;
    }
  }

  // Get the string up to the last likely valid character
  let repaired = json.substring(0, lastValidChar + 1);
  
  // If we were inside a string, close it safely
  if (inString) {
    // Check for trailing backslashes that might escape our closing quote
    let backslashCount = 0;
    for (let j = repaired.length - 1; j >= 0 && repaired[j] === '\\'; j--) {
      backslashCount++;
    }
    if (backslashCount % 2 !== 0) {
      repaired += '\\'; // Escape the escaping backslash
    }
    repaired += '"';
  }
  
  // Close any open objects/arrays in reverse order
  while (stack.length > 0) {
    repaired += stack.pop();
  }
  
  return repaired;
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

async function withRetry<T>(fn: (ai: GoogleGenAI, attempt: number) => Promise<T>, retries = 2): Promise<T> {
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
      
      // Add a 300-second timeout to the function execution (5 minutes)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("AI_CALL_TIMEOUT")), 300000)
      );
      
      const result = await Promise.race([fn(ai, attempt), timeoutPromise]) as T;
      return result;
    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase() || "";
      console.warn(`[Gemini AI] Error on attempt ${attempt + 1}:`, errorMsg);
      
      const isTimeout = errorMsg.includes("timeout") || errorMsg === "ai_call_timeout";
      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota");
      const isRpcError = errorMsg.includes("rpc failed") || errorMsg.includes("xhr error") || errorMsg.includes("failed to fetch") || errorMsg.includes("500") || errorMsg.includes("503");
      
      if (isTimeout || isQuotaError || isRpcError) {
        // Rotate key on any retryable error
        currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        
        // If we've tried all keys or max retries, throw
        if (attempt === retries) {
          if (isTimeout) {
            console.error("[Gemini AI] Call exhausted all retries and still timed out.");
          }
          throw error;
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
  return withRetry(async (ai, attempt) => {
    const model = "gemini-3-flash-preview";
    
    // If it's a docx, we extract text and treat as raw text because Gemini doesn't support it as inlineData
    let finalRawText = rawText || "";
    let isNative = fileBase64 && mimeType && isNativeAiSupport(mimeType);
    
    if (fileBase64 && mimeType && !isNative && isSupportedMime(mimeType)) {
      const extracted = await extractDocxText(fileBase64);
      finalRawText = (finalRawText ? finalRawText + "\n\n" : "") + extracted;
    }

    const prompt = `FORENSIC CLONE ARCHITECT & PIXEL-PERFECT DESIGN ENGINEER.
    
    TASK: Extract the absolute STRUCTURAL DNA of this REFERENCE RESUME with 100% fidelity.
    
    OUTPUT REQUIREMENTS:
    Return a technical "Layout Manifest" using the following format:
    
    1. COLUMN_STRATEGY: (e.g., "Single Column", "2-Column Split", "Sidebar Layout")
    2. SIDEBAR_POSITION: (e.g., "Left", "Right", "None")
    3. SIDEBAR_WIDTH_PERCENT: (e.g., "25%", "33%")
    4. HEADER_DESIGN: (e.g., "Centered Name & Contact", "Left Aligned with Background Color", "Hero Section with Photo")
    5. SECTION_HEADER_STYLE: (e.g., "Bold Uppercase with colored underline", "Small accents with icons", "Boxed background")
    6. TYPOGRAPHY: (e.g., "Main: Inter (Sans), Headings: Playfair (Serif), Sizes: 10pt/14pt")
    7. COLOR_PALETTE: (e.g., "Primary: #HEX, Secondary: #HEX, Background: #HEX, Text: #HEX")
    8. SECTION_DECOR: (e.g., "Full-width dividers", "Vertical lines between columns", "Bulleted lists style")
    9. SPACING_DNA: (e.g., "Tight line height 1.2, broad section gaps 20px")
    10. VISUAL_ACCENTS: (e.g., "Shadows on cards", "Rounded corners 8px", "Progress bars for skills")
    
    Focus on precisely describing the grid, font families, and HEX codes. Be technical and detailed.`;

    const contents: any[] = [];
    if (fileBase64 && mimeType && isNative) {
      contents.push({
        parts: [
          { inlineData: { data: fileBase64.split(',')[1] || fileBase64, mimeType } },
          { text: prompt }
        ]
      });
    } else if (finalRawText) {
      contents.push({
        parts: [{ text: prompt + "\n\nTEXT CONTENT FOR CONTEXT:\n" + finalRawText }]
      });
    } else {
      throw new Error("UNSUPPORTED_TYPE_AND_NO_TEXT");
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.1,
        maxOutputTokens: 16384,
      }
    });

    return response.text || "";
  });
}

export async function extractTextFromAny(base64: string, mimeType: string) {
  if (isSupportedMime(mimeType) && !isNativeAiSupport(mimeType)) {
    return await extractDocxText(base64);
  }

  if (!isNativeAiSupport(mimeType)) {
    throw new Error("UNSUPPORTED_MIME_FOR_AI_EXTRACTION");
  }

  return withRetry(async (ai, attempt) => {
    const model = "gemini-3-flash-preview";
    const prompt = "Extract all text content from this document exactly. Preserve logical order. No annotations.";
    const cleanBase64 = base64.split(',')[1] || base64;
    const part = { inlineData: { data: cleanBase64, mimeType } };
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [part, { text: prompt }] }],
    });
    return response.text || "";
  });
}

export async function getOptimizationPlan(userContent: string, jobDescription?: string) {
  return withRetry(async (ai, attempt) => {
    const model = "gemini-3-flash-preview";
    
    // Auto-detect JSON and convert to TOON to save tokens
    let content = userContent;
    if (userContent.trim().startsWith('{')) {
      try {
        content = TOON.stringify(JSON.parse(userContent), 'RESUME');
      } catch (e) { /* ignore and use original */ }
    }

    const prompt = `Expert ATS Strategist.
    
    ${TOON.getSystemInstruction()}
    
    CONTENT (TOON): ${content}
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
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        temperature: 0.1,
      }
    });

    try {
      const text = extractJson(response.text || "");
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
  strict: boolean = true,
  options: { lengthMode?: '1-page' | '2-page' | 'executive' | 'no-limit' } = {}
) {
  return withRetry(async (ai, attempt) => {
    // Upgraded for structural fidelity as requested
    const model = attempt > 0 ? "gemini-3-flash-preview" : "gemini-3.1-pro-preview"; 
    
    // 1. Content Optimization Prompt
    const optimizationPrompt = jobDescription 
      ? `\n\nCONTENT MAPPING & AI OPTIMIZATION:
      1. Map USER DATA into the target sections with high semantic accuracy.
      2. Rewrite bullet points to include keywords from the JOB DESCRIPTION while preserving all factual data.
      3. Focus on ACHIEVEMENTS and impact (metrics if possible).`
      : "\n\nCONTENT MAPPING: Map USER DATA into the structural containers defined by the reference visual.";

    // 2. Structural Cloning Protocol
    const layoutSystemPrompt = `
    LAYOUT CLONING PROTOCOL (STRICT ADHERENCE REQUIRED):
    - You are a front-end engineer tasked with cloning a design.
    - The DESIGN TOKENS MANIFEST provided in the context is your SOURCE OF TRUTH for layout, colors, and typography.
    - COLUMN_STRATEGY: If "2-Column", you MUST use a flex/grid layout.
    - SIDEBAR: If SIDEBAR_POSITION is "Left" or "Right", you MUST implement a sidebar with the exact SIDEBAR_WIDTH_PERCENT.
    - TYPOGRAPHY: Use the fonts and sizes specified in the manifest.
    - COLORS: Use the HEX codes for backgrounds and text.
    - INTEGRITY: Ensure the final HTML strictly follows the structure: <div class="page"><div class="content">...</div></div>.
    `;

    const atsMaxPrompt = maximizeAts 
      ? `\n\nATS ENHANCEMENT: While keeping the REFERENCE structure, ensure headings are standard (e.g., "Experience" instead of "History") and font sizes are legible.`
      : "";

    const lengthPrompt = options?.lengthMode === '1-page' 
      ? "\n\nSTRICT LENGTH CONSTRAINT: The output MUST fit on a single A4 page. Be extremely concise. Use compact spacing."
      : options?.lengthMode === '2-page'
        ? "\n\nLENGTH: Expand content to fill approximately 2 pages. More detail per role is expected."
        : options?.lengthMode === 'executive'
          ? "\n\nTHEME: High-level executive summary style. Focus on leadership and strategic impact."
          : options?.lengthMode === 'no-limit'
            ? "\n\nFULL CONTENT MODE: Do NOT truncate ANY USER DATA. Output every single experience, bullet point, skill, and certification provided in the user content. The document will be paginated by the front-end, so allow it to grow vertically to fit everything."
            : "";

    // Use full JSON for layout morphing to preserve maximum structural fidelity as requested
    const refText = reference.text || "";
    const userText = content.text || "";

    const prompt = `SUPREME FORENSIC MAPPING ENGINE & LAYOUT DNA CLONER.
    
    GOAL: Transform the data from "USER CONTENT" into the visual layout of "MASTER REFERENCE".
    
    CLONING RULES:
    1. REPLICATE THE GRID: Match column splits (e.g. 25/75 or 33/66) exactly. Put layout-defining classes (bg, padding variation, layout flex/grid) on the .page element.
    2. TYPOGRAPHIC DNA: Mirror font weights, letter spacing, and line heights.
    3. DATA PRESERVATION: Render EVERY single experience entry, skill, and certification. DO NOT summarize or omit anything.
    
    TOKEN EFFICIENCY: Be extremely concise with HTML. Use utility classes. Minimize redundant nesting.
    
    PIXEL-PERFECT RENDER:
    - Wrapper: <div class="page" data-page="Page X of Y"><div class="content">[CONTENT]</div></div>.
    - If a layout requires a sidebar, you can put the grid structure directly on the .page element, but ensure content area still uses class="content".
    - If content is long, do NOT truncate. The frontend will handle pagination by cloning the page structure. 
    - Use Tailwind classes ONLY.
    
    ${optimizationPrompt}
    ${layoutSystemPrompt}
    ${atsMaxPrompt}
    ${lengthPrompt}
    
    Return JSON with "html" key.`;

    const contents: any[] = [];
    const parts: any[] = [];

    // Add Reference Info
    if (existingLayout) {
      parts.push({ text: `### DESIGN TOKENS MANIFEST (Structural Blueprint):\n${existingLayout}` });
    }
    
    // Only send reference visual if we don't have a layout analysis OR on the first attempt
    if (reference.base64 && reference.mimeType && isNativeAiSupport(reference.mimeType)) {
      if (!existingLayout || attempt === 0) {
        parts.push({ 
          inlineData: { 
            data: reference.base64.split(',')[1] || reference.base64, 
            mimeType: reference.mimeType 
          } 
        });
      }
    } else if (reference.text) {
      parts.push({ text: `### REFERENCE CONTENT STRUCTURE:\n${reference.text}` });
    }

    // Add User Content Info - ABSOLUTE PRIORITY FOR DATA
    if (content.text) {
      // Use TOON to save input tokens if text is long
      let userContent = content.text;
      if (userContent.length > 3000 && userContent.trim().startsWith('{')) {
        try {
          userContent = TOON.stringify(JSON.parse(userContent), 'USER_DATA');
        } catch(e) {}
      }
      parts.push({ text: `### USER CONTENT (The ONLY facts to be used):\n${userContent}` });
    }
    
    // Only send user visual if we DON'T have the text yet
    if (content.base64 && content.mimeType && isNativeAiSupport(content.mimeType)) {
      if (!content.text) {
        parts.push({ 
          inlineData: { 
            data: content.base64.split(',')[1] || content.base64, 
            mimeType: content.mimeType 
          } 
        });
      }
    }

    if (jobDescription) {
      parts.push({ text: `### TARGET JOB:\n${jobDescription}` });
    }

    // Finally, the prompt with the instructions
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({ 
      model,
      contents: [{ parts }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            html: { type: Type.STRING },
            name: { type: Type.STRING },
            atsScore: { type: Type.NUMBER },
            atsFeedback: { type: Type.STRING },
            matchScore: { type: Type.NUMBER },
            missingKeywords: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            layoutAnalysis: { type: Type.STRING },
            integrityMetrics: {
              type: Type.OBJECT,
              properties: {
                sourceFieldCount: { type: Type.NUMBER },
                renderedFieldCount: { type: Type.NUMBER },
                omittedFields: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["sourceFieldCount", "renderedFieldCount", "omittedFields"]
            }
          },
          required: ["html", "name", "atsScore", "atsFeedback", "matchScore", "missingKeywords", "layoutAnalysis", "integrityMetrics"]
        },
        temperature: 0.1,
        maxOutputTokens: 16384,
      }
    });

    try {
      const respText = response.text || "";
      
      const text = extractJson(respText);
      const result = JSON.parse(text);
      if (!result.html) throw new Error("EMPTY_HTML");
      return result;
    } catch (e) {
      console.error("AI Response Parsing Failed:", e);
      // Check if it was a truncation issue
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === 'MAX_TOKENS') {
         console.error("[Gemini AI] Response was truncated due to MAX_TOKENS limit (16384).");
         // Special handling for truncation: try to parse what we have if it's usable
         try {
           const truncatedText = extractJson(response.text || "");
           const result = JSON.parse(truncatedText);
           if (result.html) {
             console.warn("[Gemini AI] Using repaired truncated response.");
             return result;
           }
         } catch (reErr) {
           console.error("[Gemini AI] Failed to repair truncated JSON:", reErr);
         }
      }
      throw new Error(`Resume generation failed: ${e instanceof Error ? e.message : 'Parsing Error'}. The content might be too long.`);
    }
  });
}

export async function checkMatch(resumeText: string, jobDescription: string) {
  return withRetry(async (ai, attempt) => {
    const model = "gemini-3-flash-preview";
    
    // Auto-detect JSON and convert to TOON
    let content = resumeText;
    if (resumeText.trim().startsWith('{')) {
      try {
        content = TOON.stringify(JSON.parse(resumeText), 'RESUME');
      } catch (e) { /* ignore */ }
    }

    const prompt = `Expert ATS Matcher.
    
    ${TOON.getSystemInstruction()}
    
    RESUME (TOON): ${content}
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
      contents: [{ parts: [{ text: prompt }] }],
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
      }
    });

    try {
      const text = extractJson(response.text || "");
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse match response", e);
      return { score: 0, missing: [] };
    }
  });
}

export async function generatePortfolioContent(resumeText: string, githubData?: any) {
  return withRetry(async (ai, attempt) => {
    const model = "gemini-3-flash-preview";
    
    const resumeToon = resumeText.startsWith('{') ? TOON.stringify(JSON.parse(resumeText), 'RESUME') : resumeText;
    const githubToon = githubData ? TOON.stringify(githubData, 'GITHUB') : "";

    const prompt = `SUPREME PORTFOLIO ARCHITECT & BRAND STRATEGIST.
    
    ${TOON.getSystemInstruction()}
    
    RESUME DATA (TOON): ${resumeToon}
    ${githubToon ? `GITHUB REPOSITORIES (TOON): ${githubToon}` : ""}
    
    TASK: Architect a world-class personal brand identity and website content based on the provided resume.
    
    CONTENT STRATEGY:
    1. BRAND POSITIONING:
       - Create a "Headline" that is bold, unique, and value-driven (e.g., "Architecting Scalable Cloud Ecosystems" instead of "Cloud Engineer").
       - Craft an "About Me" narrative that focuses on the "Why" and "How", not just the "What". Use an engaging, professional story-telling tone.
    2. PROJECT STORYTELLING:
       - If GitHub data exists, select the top 3 most technically impressive repositories.
       - Each project must have:
         - A clear "Problem Statement" (implied from tech stack).
         - A "Technical Solution" description.
         - An "Impact" statement (even if predicted, e.g., "Optimizing for 20% faster execution").
    3. EXPERIENCE REFINEMENT:
       - Transform resume bullets into "Achievement Markers".
       - Focus on scale, complexity, and specific technical contributions.
    4. SKILLS CURATION:
       - Select the most powerful, industry-relevant skills. Categorize them mentally to pick a balanced mix.
    5. DATA COMPLETION:
       - If sections are sparse (e.g., no projects), simulate 2-3 high-level industry-standard projects that someone with those specific skills would realistically build.
    
    OUTPUT: JSON object strictly adhering to the PortfolioContent interface.
    
    PortfolioContent Interface:
    {
      hero: { name: string, headline: string, subheadline: string },
      about: string,
      skills: string[],
      experience: [{ company: string, role: string, duration: string, description: string[] }],
      projects: [{ title: string, description: string, tech: string[], link?: string, github?: string }],
      education: [{ school: string, degree: string, year: string }],
      contact: { email: string, linkedin?: string, github?: string }
    }
    
    Return ONLY JSON. No markdown formatting.`;

    const response = await ai.models.generateContent({ 
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hero: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                headline: { type: Type.STRING },
                subheadline: { type: Type.STRING }
              },
              required: ["name", "headline", "subheadline"]
            },
            about: { type: Type.STRING },
            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  description: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["company", "role", "duration", "description"]
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tech: { type: Type.ARRAY, items: { type: Type.STRING } },
                  link: { type: Type.STRING },
                  github: { type: Type.STRING }
                },
                required: ["title", "description", "tech"]
              }
            },
            education: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  school: { type: Type.STRING },
                  degree: { type: Type.STRING },
                  year: { type: Type.STRING }
                },
                required: ["school", "degree", "year"]
              }
            },
            contact: {
              type: Type.OBJECT,
              properties: {
                email: { type: Type.STRING },
                linkedin: { type: Type.STRING },
                github: { type: Type.STRING }
              },
              required: ["email"]
            }
          },
          required: ["hero", "about", "skills", "experience", "projects", "education", "contact"]
        },
        temperature: 0.2,
      }
    });

    try {
      const text = extractJson(response.text || "");
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse portfolio response", e);
      throw new Error("Failed to generate portfolio content");
    }
  });
}

export async function conversationalEdit(currentData: any, command: string, history: any[] = []) {
  return withRetry(async (ai, attempt) => {
    // Upgraded for better instruction following
    const model = "gemini-3-flash-preview"; 
    
    // Convert to TOON to optimize token usage
    const dataToon = TOON.stringify(currentData, 'RESUME');

    const prompt = `You are an AI Resume Editor embedded inside SmartEditor.tsx.

Your job is to edit an existing resume JSON/HTML layout WITHOUT changing its design, structure, styling, spacing, or formatting.

STRICT RULES:
1. DO NOT modify layout, styling, fonts, spacing, alignment, margins, or sections order.
2. ONLY update content based on user instruction.
3. Preserve exact structure of the reference resume (clone-based editing).
4. DO NOT add any new design elements (no lines, icons, bullets, dividers unless already present).
5. DO NOT hallucinate data. Only use:
   - Existing resume data
   - User instructions
6. If user asks vague instruction → ask clarification instead of guessing.
7. Maintain professional resume language while editing.

---

SUPPORTED USER INTENTS:
1. UPDATE existing content
2. ADD new content
3. DELETE content
4. MODIFY sections
5. RESTRUCTURE CONTENT ONLY (not layout)

---

MULTI-STEP EDITING MODE:
- Maintain a working state of resume (DRAFT MODE)
- Apply all user instructions step by step
- DO NOT finalize until user says: "SAVE" or "FINALIZE"

---

SAVE BEHAVIOR:
When user says "SAVE" or "SAVE IT":
1. Freeze all edits
2. Return FINAL structured resume data
3. Mark state as FINALIZED = true
4. Enable Download Button (frontend trigger)

---

OUTPUT FORMAT (STRICT):
Always return valid JSON:
{
  "status": "editing" | "final" | "clarification_needed",
  "message": "Used for clarification or summary of changes",
  "changes_applied": ["list of strings"],
  "updated_resume": {full_structured_resume_data},
  "finalized": true | false
}

CURRENT RESUME DATA (TOON):
${dataToon}

USER COMMAND: "${command}"

Return ONLY valid JSON.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
      }
    });

    try {
      const respText = response.text || "";
      const jsonText = extractJson(respText);
      const result = JSON.parse(jsonText);
      
      // If the AI used TOON inside updated_resume (unlikely with this prompt but safe to check)
      if (typeof result.updated_resume === 'string' && result.updated_resume.includes('[RESUME]')) {
         result.updated_resume = TOON.parse(result.updated_resume);
      }

      return result;
    } catch (e) {
      console.error("Conversational edit failed", e);
      throw new Error("I couldn't process that specific edit. Please try rephrasing.");
    }
  });
}

export async function parseResumeToData(file: { base64: string; mimeType: string; text?: string }) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    const parts: any[] = [];
    
    if (file.base64 && isNativeAiSupport(file.mimeType)) {
      parts.push({
        inlineData: {
          data: file.base64.split(',')[1] || file.base64,
          mimeType: file.mimeType
        }
      });
    } else if (file.base64 && isSupportedMime(file.mimeType)) {
      const extracted = await extractDocxText(file.base64);
      parts.push({ text: `RAW TEXT FROM DOCUMENT:\n${extracted}` });
    } else if (file.text) {
      parts.push({ text: `RAW TEXT:\n${file.text}` });
    }

    const prompt = `EXPERT UNIVERSAL RESUME CONTENT EXTRACTOR.
    
    ${TOON.getSystemInstruction()}
    
    TASK: Extract EVERY single detail from this resume into TOON format. 
    
    EXTRACTION RULES (ZERO DATA LOSS):
    1. OMISSION IS FORBIDDEN: Do not skip any text, section, or meta-data.
    2. STRUCTURE DETECTION: If the resume uses tables, grouped sets, or unique labels, capture them accurately.
    3. DYNAMIC SECTIONS: If you find data that doesn't fit standard tags (Personal Info, Experience, Education, Skills), put it into [CS] (Custom Sections).
       - Format: [CS][ITEM]title:Section Title|its:item1~item2[/ITEM][/CS]
    4. DETAILED EXTRACTION: Capture dates precisely, full company names, all bullet points, and all skill categories.
    5. Output ONLY the TOON string starting with [RESUME] and ending with [/RESUME].
    
    TOON STRUCTURE:
    [RESUME]
      [PI]n:...|ti:...|e:...|p:...|l:...|links:[ITEM]label:...|val:...[/ITEM][/PI]
      [SUM]...[/SUM]
      [EXP][ITEM]c:...|r:...|d:...|l:...|b:bullet1~bullet2[/ITEM][/EXP]
      [PROJ][ITEM]n:...|desc:...|t:...|lnk:...[/ITEM][/PROJ]
      [EDU][ITEM]s:...|deg:...|y:...|gpa:...[/ITEM][/EDU]
      [SK]category1:s1,s2~category2:s3,s4[/SK]
      [CERT]cert1~cert2[/CERT]
      [CS][ITEM]ti:Section Name|b:item1~item2[/ITEM][/CS]
    [/RESUME]`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        temperature: 0.1,
        maxOutputTokens: 16384,
      }
    });

    try {
      const respText = response.text || "";
      // Re-extract if there's markdown or extra text
      const toonMatch = respText.match(/\[RESUME\][\s\S]*?\[\/RESUME\]/);
      const toonContent = toonMatch ? toonMatch[0] : respText;
      
      const parsed = TOON.parse(toonContent);
      
      // Ensure the structure matches what the app expects
      if (parsed && typeof parsed === 'object') {
        if (!parsed.personalInfo && parsed.pi) parsed.personalInfo = parsed.pi;
        if (!parsed.skills && parsed.sk) parsed.skills = parsed.sk;
        if (!parsed.summary && parsed.sum) parsed.summary = parsed.sum;
        if (!parsed.experience && parsed.exp) parsed.experience = parsed.exp;
        if (!parsed.projects && parsed.proj) parsed.projects = parsed.proj;
        if (!parsed.education && parsed.edu) parsed.education = parsed.edu;
        if (!parsed.certifications && parsed.cert) parsed.certifications = parsed.cert;
      }

      // Semantic validation
      if (TOON.validateResumeData(parsed)) {
        return parsed;
      }
      
      throw new Error("Invalid TOON structure");
    } catch (e) {
      console.warn("TOON parsing failed or invalid, attempting JSON fallback", e);
      try {
        const rawText = response.text || "";
        const jsonText = extractJson(rawText);
        if (!jsonText) throw new Error("No valid JSON found in response");
        
        // If JSON is clearly truncated (ends with ... or in middle of word), try to fix it
        const cleanedJson = repairJson(jsonText);
        const jsonParsed = JSON.parse(cleanedJson);
        if (TOON.validateResumeData(jsonParsed)) {
          return jsonParsed;
        }
        throw new Error("JSON structure invalid for resume");
      } catch (jsonErr) {
        console.error("All parsing attempts failed", jsonErr);
        // If it's a truncation error, provide more context
        const finishReason = response.candidates?.[0]?.finishReason;
        const detail = finishReason === 'MAX_TOKENS' ? "Response was truncated" : "Parsing Error";
        throw new Error(`Resume structure extraction failed: ${detail}. The document might be too complex or long.`);
      }
    }
  });
}

export async function generateCoverLetter(resumeText: string, jobTitle: string, company?: string, jobDescription?: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    let content = resumeText;
    if (resumeText.trim().startsWith('{')) {
      try {
        content = TOON.stringify(JSON.parse(resumeText), 'RESUME');
      } catch (e) { /* ignore */ }
    }

    const prompt = `Expert Career Coach & Copywriter.
    
    ${TOON.getSystemInstruction()}
    
    RESUME (TOON): ${content}
    JOB: ${jobTitle} ${company ? `at ${company}` : ""}
    ${jobDescription ? `JOB DESCRIPTION: ${jobDescription}` : ""}
    
    TASK: Write a high-impact, professional cover letter tailored to this role based on the resume content.
    
    RULES:
    1. Modern, persuasive, and professional tone.
    2. Focus on specific achievements from the resume that match the role.
    3. Keep it under 400 words.
    4. Provide placeholders for [Manager Name], [Date], etc. if unknown.
    
    OUTPUT: A string containing the cover letter.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.7 }
    });

    return response.text || "";
  });
}

export async function improveBulletPoint(bullet: string, context: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Expert Resume Writer.
    
    BULLET POINT: ${bullet}
    CONTEXT (Role/Company): ${context}
    
    TASK: Rewrite this bullet point to be more impactful using the "Action Verb + Task + Quantifiable Result" framework.
    
    RULES:
    1. Start with a strong action verb.
    2. Quantify achievements if possible (predict a realistic metric if one isn't provided).
    3. Keep it concise (max 2 lines).
    
    OUTPUT: Just the rewritten bullet point string.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: { temperature: 0.3 }
    });

    return response.text || "";
  });
}

export async function generateResumeFromData(
  data: any,
  styles: any,
  referenceLayout: string | null = null,
  referenceBase64: string | null = null,
  referenceMime: string | null = null
) {
  return withRetry(async (ai) => {
    const model = "gemini-3.1-pro-preview";
    const parts: any[] = [];
    
    // THE BUG FIX: Actually include the data and styles in the prompt!
    const dataToon = TOON.stringify(data, 'USER_DATA');
    const stylesToon = TOON.stringify(styles, 'DESIGN_TOKENS_OVERRIDE');

    const prompt = `SUPREME FRONT-END DESIGN ENGINEER & CLONE ARCHITECT.
    
    TASK: Code a pixel-perfect resume by CLONING the visual architecture of the "REFERENCE VISUAL" and injecting the provided "USER DATA".
    
    LAYOUT CLONING PROTOCOL (NON-NEGOTIABLE):
    - The REFERENCE LAYOUT MANIFEST is the absolute blueprint. You MUST follow its COLUMN_STRATEGY, SIDEBAR_POSITION, SIDEBAR_WIDTH_PERCENT, HEADER_DESIGN, and SECTION_HEADER_STYLE.
    - If a sidebar is specified:
      - Use a flex container with "gap-8".
      - The SIDEBAR_WIDTH_PERCENT from the manifest MUST be used for the sidebar's width class (e.g., if 30%, use w-[30%]).
      - Position it exactly where SIDEBAR_POSITION specifies ("Left" or "Right").
    - HEADER: Clone the HEADER_DESIGN exactly.
    - SECTION TITLES: Match the SECTION_HEADER_STYLE carefully.
    - If single column, use a single full-width container.
    
    STRUCTURE TEMPLATES:
    - Sidebar Left: <div class="content flex gap-8"><div class="layout-sidebar w-[SIDEBAR_WIDTH] shrink-0">...</div><div class="layout-main flex-1">...</div></div>
    - Sidebar Right: <div class="content flex gap-8"><div class="layout-main flex-1">...</div><div class="layout-sidebar w-[SIDEBAR_WIDTH] shrink-0">...</div></div>
    - Single Column: <div class="content"><div class="layout-main w-full">...</div></div>

    GRANULARITY RULE (CRITICAL FOR PAGINATION):
    - DO NOT wrap entire major sections (like all of Experience) in a single high-level container if possible. 
    - Instead, render each Experience entry, Education entry, or major section as a DIRECT child of the <div class="content"> or <div class="layout-main/sidebar">.
    - This allows the pagination engine to break the resume between jobs or headers rather than moving the entire section to a new page.

    STYLE RULES:
    - TYPOGRAPHY: Use fonts defined in DESIGN_TOKENS_OVERRIDE.
    - COLOR: Use specific HEX codes from the layout manifest.
    - ICONS: Use Lucide icons: <i data-lucide="..."></i>.
    - CONTAINER: The outer wrapper MUST have w-[794px] to match A4 width.
    - SPACING: Replicate the SPACING_DNA, SECTION_DECOR, and VISUAL_ACCENTS from the manifest.
    - DATA INTEGRITY: Render EVERY entry from USER_DATA. No summaries.
    
    PIXEL-PERFECT RENDER:
    - Wrapper: <div class="page" data-page="Page X of Y"><div class="content">[CONTENT]</div></div>.
    
    USER_DATA (TOON):
    ${dataToon}
    
    DESIGN_TOKENS_OVERRIDE (TOON):
    ${stylesToon}
    
    ${referenceLayout ? `### REFERENCE LAYOUT MANIFEST:\n${referenceLayout}` : ''}
    
    Output ONLY JSON with the "html" key.`;

    if (referenceBase64 && referenceMime && isNativeAiSupport(referenceMime)) {
      parts.push({
        inlineData: {
          data: referenceBase64.split(',')[1] || referenceBase64,
          mimeType: referenceMime
        }
      });
      parts.push({ text: "### REFERENCE VISUAL (Layout Source of Truth)" });
    }

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            html: { type: Type.STRING }
          },
          required: ["html"]
        },
        temperature: 0.1,
        maxOutputTokens: 16384,
      }
    });

    return JSON.parse(extractJson(response.text || "{\"html\": \"\"}"));
  });
}

export async function compareResumes(oldResume: string, newResume: string): Promise<string> {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";

    let oldC = oldResume;
    if (oldResume.trim().startsWith('{')) {
      try {
        oldC = TOON.stringify(JSON.parse(oldResume), 'OLD_RESUME');
      } catch (e) { /* ignore */ }
    }

    let newC = newResume;
    if (newResume.trim().startsWith('{')) {
      try {
        newC = TOON.stringify(JSON.parse(newResume), 'NEW_RESUME');
      } catch (e) { /* ignore */ }
    }

    const prompt = `You are a career change analyst. Compare these two versions of a resume and summarize the key textual differences and improvements. 
    Focus on how the AI "Morphed" or improved the content.
    
    ${TOON.getSystemInstruction()}
    
    OLD VERSION (TOON):
    ${oldC.substring(0, 5000)}
    
    NEW VERSION (TOON):
    ${newC.substring(0, 5000)}
    
    Format the output in clear Markdown:
    - ### Summary of Changes
    - ### Improvements Made (Bullet points)
    - ### Formatting & Structure (Bullet points)
    - ### Missing Elements (If any)
    
    Be objective and professional. Limit the response to 300 words.`;

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        temperature: 0.1,
      }
    });

    return response.text || "Could not generate comparison.";
  });
}
