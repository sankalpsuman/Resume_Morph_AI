import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

// Gemini supported multimodal types
const SUPPORTED_MIMES = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif'];

function isSupportedMime(mime?: string) {
  if (!mime) return false;
  return SUPPORTED_MIMES.includes(mime.toLowerCase());
}

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
    
    const prompt = `X-RAY VISUAL ARCHITECT.
    
    TASK: Perform a deep structural and aesthetic audit of this reference resume to create a "Pixel-Perfect Development Spec" for a high-fidelity clone.
    
    ANALYSIS REQUIREMENTS:
    1. ATMOSPHERE & ZONING: Identify all color-blocked zones. (e.g., "Deep blue header spanning top 20%", "Light gray sidebar with 30% width", "Full white main content area"). State the EXACT colors (HEX/RGB).
    2. GEOMETRIC DNA: Note any unique shapes or borders. Are there circular profile image placeholders? Rounded corners (\`rounded-lg\`, \`rounded-3xl\`)? Thick dividers?
    3. GRID LAYOUT: Define the column/row structure. Is it a complex bento-grid? A strict two-column split? A layered z-index design?
    4. TYPOGRAPHIC DNA: Mirror the font categories (Technical Mono, Elegant Serif, Clean Sans). Identify precise weights and cases (e.g., "Section headers: 14pt, Bold, Tracking-widest, Uppercase").
    5. DATA FLOW: Map where specific content types are placed in the reference (e.g., "Contact info sits in the header center", "Skills are in a tag-cloud format in the right sidebar").
    
    OUTPUT: A comprehensive technical Tailwind CSS "Visual Blueprint". Focus on defining the EXACT style tokens and structural hierarchy needed to replicate the graphics and colors perfectly.`;

    const contents: any[] = [];
    if (fileBase64 && mimeType && isSupportedMime(mimeType)) {
      contents.push({
        parts: [
          { inlineData: { data: fileBase64, mimeType } },
          { text: prompt }
        ]
      });
    } else if (rawText) {
      contents.push({
        parts: [{ text: prompt + "\n\nTEXT CONTENT FOR CONTEXT:\n" + rawText }]
      });
    } else {
      throw new Error("UNSUPPORTED_TYPE_AND_NO_TEXT");
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        temperature: 0.1,
        maxOutputTokens: 2048,
      }
    });

    return response.text || "";
  });
}

export async function extractTextFromAny(base64: string, mimeType: string) {
  if (!isSupportedMime(mimeType)) {
    throw new Error("UNSUPPORTED_MIME_FOR_AI_EXTRACTION");
  }

  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    const prompt = "Extract all text content from this document exactly. Preserve logical order. No annotations.";
    const part = { inlineData: { data: base64, mimeType } };
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [part, { text: prompt }] }],
    });
    return response.text || "";
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
  strict: boolean = true
) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const optimizationPrompt = jobDescription 
      ? `\n\nCONTENT MAPPING & AI OPTIMIZATION:
      1. Map USER DATA into the target sections.
      2. Rewrite bullet points to include keywords from the JOB DESCRIPTION while preserving all factual data.
      3. Use action verbs and quantifiable metrics.`
      : "\n\nCONTENT MAPPING: Purely map USER DATA into the structural containers. No style changes allowed.";

    const atsMaxPrompt = maximizeAts 
      ? `\n\nATS ENHANCEMENT: While keeping the REFERENCE structure, ensure headings are standard (e.g., "Experience" instead of "History") and font sizes are legible.`
      : "";

    const prompt = `EXPERT FRONT-END GRAPHIC ARCHITECT.
    
    GOAL: Replicate the REFERENCE VISUAL's aesthetic, zoning, and structural identity with absolute (100%) fidelity using Tailwind CSS.
    
    CRITICAL DESIGN DIRECTIVES (STRICT ENFORCEMENT):
    1. ATMOSPHERIC LAYERING & COLORS: You MUST extract and use the EXACT HEX colors for every zone. If there is a deep-blue sidebar (\`bg-[#123456]\`), a gray header (\`bg-[#f3f4f6]\`), or specific text accents, mirror them. Use \`bg-opacity-...\` or gradients if necessary to match the "depth" of the reference.
    2. PIXEL-PERFECT GRID: Recreate the column layout exactly (e.g., \`grid-cols-[300px_1fr]\`, \`flex-col\`, etc.). Capture the exact width ratios and padding/margins.
    3. GRAPHIC MOTIFS & SHAPES: 
       - Replicate circular or rounded profile image containers (\`rounded-full\`, \`aspect-square\`). 
       - Mirror the divider styles (thickness, color, dashes). 
       - If sections have shadow boxes (\`shadow-md\`), replicate them.
       - Use Lucide-react icons where the reference shows icons.
    4. TYPOGRAPHIC MIRROR: Use Google Fonts equivalents. Matches the Serif/Sans/Mono categories and weights. Match uppercase/lowercase and letter-spacing (\`tracking-...\`).
    5. DATA MAPPING: Inject USER DATA into these precise visual slots.
       - IMPORTANT: Do not move sections. If the reference has "Skills" at the top-right, put the user's skills there.
    
    STRICT VISUAL MODE: Treat the REFERENCE IMAGE as a "Design Mockup" that must be coded into a living page. The USER CONTENT is simply the JSON data for that mockup.
    
    ADVANCED GRAPHICS DIRECTIVE: If the reference uses overlapping elements, negative margins, or layered images, you MUST implement them. Use \`z-index\`, \`relative/absolute\`, and \`overflow-hidden\` to achieve the high-graphic look. Do NOT simplify the design.
    
    ${optimizationPrompt}
    ${atsMaxPrompt}
    
    TECHNICAL OUTPUT:
    - Return valid JSON.
    - The "html" string MUST be a self-contained Tailwind-styled structure.
    - Do NOT include <html> or <body> tags, just the inner content.
    - Ensure all absolute/fixed positioning is avoided; use relative layout flows.
    
    JSON STRUCTURE:
    {
      "html": "...",
      "name": "...",
      "yoe": "...",
      "profile": "...",
      "atsScore": ...,
      "atsFeedback": "...",
      "matchScore": ...,
      "missingKeywords": [],
      "layoutAnalysis": "...",
      "extractedText": "..."
    }`;

    const contents: any[] = [];
    const parts: any[] = [];

    // Add Reference Info - ALWAYS include visual if available and supported
    if (reference.base64 && reference.mimeType && isSupportedMime(reference.mimeType)) {
      parts.push({ 
        inlineData: { 
          data: reference.base64.split(',')[1] || reference.base64, 
          mimeType: reference.mimeType 
        } 
      });
      parts.push({ text: "MASTER REFERENCE VISUAL: Replicate this layout architecture perfectly." });
    }

    if (existingLayout) {
      parts.push({ text: `STRUCTURAL BLUEPRINT (Already analyzed): ${existingLayout}` });
    } else if (reference.text) {
      parts.push({ text: `REFERENCE TEXT/STRUCTURE: ${reference.text}` });
    }

    // Add User Content Info - include visual if supported for better data extraction
    if (content.base64 && content.mimeType && isSupportedMime(content.mimeType)) {
      parts.push({ 
        inlineData: { 
          data: content.base64.split(',')[1] || content.base64, 
          mimeType: content.mimeType 
        } 
      });
      parts.push({ text: "USER CONTENT SOURCE (Visual): Use this for high-fidelity data extraction." });
    }
    
    if (content.text) {
      parts.push({ text: `CRITICAL USER TEXT DATA: ${content.text}` });
    }

    // Add JD
    if (jobDescription) {
      parts.push({ text: `TARGET JOB DESCRIPTION (Use for keyword optimization): ${jobDescription}` });
    }

    // Add Final Prompt
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
      }
    });

    try {
      const text = extractJson(response.text || "");
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse AI response as JSON", e);
      return { 
        html: response.text || "", 
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
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Expert Portfolio Architect.
    
    RESUME CONTENT: ${resumeText}
    ${githubData ? `GITHUB DATA: ${JSON.stringify(githubData)}` : ""}
    
    TASK:
    1. Parse the resume and extract: Name, Title, Skills, Experience, Projects, Education.
    2. Improve content:
       - Rewrite experience into impactful bullet points.
       - Generate a professional summary.
       - Create a strong, catchy hero headline.
    3. Generate missing content:
       - If no projects are found, create 2-3 realistic sample projects based on their skills.
       - If the summary is weak, enhance it significantly.
    4. If GitHub data is provided, incorporate top repositories as projects.
    
    OUTPUT: JSON object matching the PortfolioContent interface.
    
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
    
    Return ONLY JSON.`;

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
