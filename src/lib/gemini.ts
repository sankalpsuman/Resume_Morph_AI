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
    
    const prompt = `VISIONARY DESIGN AUDITOR & SYSTEM ARCHITECT.
    
    TASK: Deconstruct this REFERENCE RESUME into a "High-Fidelity Implementation Manifest".
    
    AUDIT REQUIREMENTS (Be mathematically precise):
    1. CANVAS & ZONING: 
       - Identify the Page Format (e.g., Single Column, Split Sidebar, Asymmetric 3-Column).
       - Determine exact width percentages for columns (e.g., "Left Sidebar: 33%, Main: 67%").
       - Detect "Bleed" or "Full-Height" color zones (e.g., "Sidebar spans 100% height with #1a202c background").
    2. COLOR STRATUM:
       - Extract HEX codes for: Backgrounds, Section Headers, Body Text, Accent Borders, and Secondary text.
       - Note any gradients (linear-gradient(direction, startColor, endColor)).
    3. TYPOGRAPHIC BLUEPRINT:
       - Mirror the "Mood": Formal Serif, Tech Mono, Minimalist Sans.
       - Identify Font Weights (100-900), Letter Spacing (Tracking), and Line Heights (Leading).
       - Note Case Styling: UPPERCASE headers, Sentence case body, etc.
    4. COMPONENT ARCHAEOLOGY:
       - SHAPES: Detect circular profile images, rounded containers (radius in px/rem), or geometric dividers.
       - ICONS: Identify where icons are used (Contact section, Skills, Section Titles).
       - DECOR: Note "Progress Bars" for skills, "Star Ratings", or "Dot Matrices".
    5. SPACING CONSTANTS:
       - Measure the "Gutters" (gap between columns).
       - Measure Section Margins (Vertical spacing between Work and Education).
    
    OUTPUT: A technical "Design Token Object" (in Tailwind terminology) that describes the exact visual identity. No fluff. Just specs.`;

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
      1. Map USER DATA into the target sections with high semantic accuracy.
      2. Rewrite bullet points to include keywords from the JOB DESCRIPTION while preserving all factual data.
      3. Ensure EVERY segment of the job description is addressed in the rewritten content.`
      : "\n\nCONTENT MAPPING: Map USER DATA into the structural containers defined by the reference visual.";

    const layoutSystemPrompt = `
    LAYOUT SYSTEM SPECIFICATIONS:
    - DETECT COLUMNS: If there is a sidebar, calculate the exact width (e.g., 1/3 or 300px).
    - SPATIAL ACCURACY: Replicate headers, footers, and floating sidebars.
    - REPLICATE SHAPES: Use Tailwind classes for rounded corners, borders, and color zones.
    - INFOGRAPHIC ELEMENTS: If skills are shown as bars, use <div class="h-2 bg-gray-200 rounded"><div class="h-full bg-blue-500" style="width: 80%"></div></div>.
    - ICONS & GRAPHICS: Use Lucide icons (e.g., <i data-lucide="mail"></i>) or SVG for all visual symbols.
    `;

    const atsMaxPrompt = maximizeAts 
      ? `\n\nATS ENHANCEMENT: While keeping the REFERENCE structure, ensure headings are standard (e.g., "Experience" instead of "History") and font sizes are legible.`
      : "";

    const prompt = `EXPERT FULL-STACK DESIGN SYSTEM ENGINEER.
    
    TASK: Implement a "Pixel-Perfect Digital Clone" of the REFERENCE VISUAL using Tailwind CSS. 
    You are coding a live website based on a professional designer's mockup.
    
    PRIMARY OBJECTIVE: Replicate the Reference Visual's geometry, colors, and atmosphere with 99% accuracy. 
    Ignore the User Content's original layout; strictly map its data into the Reference's containers.
    
    CORE IMPLEMENTATION COMMANDS:
    1. GEOMETRIC ARCHITECTURE: 
       - Build the exact layout (Split-screens, Sidebars, Bento Grids, Inline-Header styles).
       - Use arbitrary Tailwind values for precision: \`w-[32%]\`, \`bg-[#121212]\`, \`p-[2.5rem]\`.
       - If there is a sidebar, it must be the exact color and width ratio as the reference.
    2. THEMATIC COLORS:
       - Mirror every color. If the reference is dark-themed, use a dark theme. 
       - If there are accent lines, sidebar borders, or colorful header blocks, replicate them exactly.
    3. COMPONENT FIDELITY: 
       - Mirror the "Component Archetypes": Boxed skills, progress bars, circular profile images (\`rounded-full w-32 h-32\`), and specific icon placements.
       - Use inline SVG code or Lucide icons for any graphics found in the reference.
    4. DATA SLOT MAPPING:
       - Intelligently place user content into the Reference's slots. 
       - Reference's "Profile" slot → User's "Professional Summary".
       - Reference's "Skills" pill grid → User's Skill list as a pill grid.
       - Reference's "Experience" timeline → User's Work History as a timeline.
    5. ADVANCED STYLING:
       - Use \`z-index\`, \`absolute/relative\` positioning if the reference shows overlapping or complex floating elements.
       - Ensure the text contrast and typography (weights, spacing) match the "Design Blueprint" provided.
    
    STRICT CONSTRAINT: You are NOT allowed to simplify. If the reference is a complex infographic, you MUST write the complex Tailwind code to match it.
    
    ADVANCED GRAPHICS DIRECTIVE: If the reference uses overlapping elements, negative margins, or layered images, you MUST implement them. Use \`z-index\`, \`relative/absolute\`, and \`overflow-hidden\` to achieve the high-graphic look. Do NOT simplify the design.
    
    ${optimizationPrompt}
    ${layoutSystemPrompt}
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
      parts.push({ text: "### MASTER REFERENCE DOCUMENT (Visual & Layout Blueprint)" });
    }

    if (existingLayout) {
      parts.push({ text: `### DESIGN TOKENS MANIFEST (Already Analyzed):\n${existingLayout}` });
    } else if (reference.text) {
      parts.push({ text: `### REFERENCE CONTENT STRUCTURE:\n${reference.text}` });
    }

    // Add User Content Info - include visual if supported for better data extraction
    if (content.base64 && content.mimeType && isSupportedMime(content.mimeType)) {
      parts.push({ 
        inlineData: { 
          data: content.base64.split(',')[1] || content.base64, 
          mimeType: content.mimeType 
        } 
      });
      parts.push({ text: "### USER CONTENT SOURCE (Reference for data extraction)" });
    }
    
    if (content.text) {
      parts.push({ text: `### USER RAW TEXT CONTENT (The facts to insert):\n${content.text}` });
    }

    // Add JD
    if (jobDescription) {
      parts.push({ text: `### TARGET JOB OPPORTUNITY:\n${jobDescription}` });
    }

    // Add Final Prompt
    parts.push({ text: prompt });

    const response = await ai.models.generateContent({ 
      model,
      contents: [{ parts }],
      config: { 
        temperature: 0.2, // Slightly higher for better layout creativity
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
