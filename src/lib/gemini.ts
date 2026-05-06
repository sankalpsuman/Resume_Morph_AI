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

// Helper to extract JSON from a string that might contain extra text
function extractJson(text: string): string {
  if (!text) return "";
  
  // First, try to handle markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    const cleaned = markdownMatch[1].trim();
    if (cleaned.startsWith('{') || cleaned.startsWith('[')) return cleaned;
  }

  // Find actual JSON object start
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  
  // Find actual JSON array start: [ followed by optional whitespace and a valid JSON character
  // Differentiates from [RESUME] or other TOON tags
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

  if (start !== -1 && end !== -1 && end > start) {
    const candidate = text.substring(start, end + 1).trim();
    // Strict JSON check: must start/end with correct braces and NOT look like TOON [TAG]
    if ((candidate.startsWith('{') && candidate.endsWith('}')) || 
        (candidate.startsWith('[') && candidate.endsWith(']') && !/^\[[A-Z_]+\]/.test(candidate))) {
      return candidate;
    }
  }
  
  return "";
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
      console.log(`[Gemini AI] Attempt ${attempt + 1}/${retries + 1} using key index ${currentKeyIndex}`);
      
      // Add a 120-second timeout to the function execution
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("AI_CALL_TIMEOUT")), 120000)
      );
      
      const result = await Promise.race([fn(ai), timeoutPromise]) as T;
      console.log(`[Gemini AI] Success on attempt ${attempt + 1}`);
      return result;
    } catch (error: any) {
      const errorMsg = error?.message?.toLowerCase() || "";
      console.warn(`[Gemini AI] Error on attempt ${attempt + 1}:`, errorMsg);
      
      if (errorMsg === "ai_call_timeout") {
        console.error("[Gemini AI] Call timed out after 120s");
      }

      const isQuotaError = errorMsg.includes("429") || errorMsg.includes("quota");
      const isRpcError = errorMsg.includes("rpc failed") || errorMsg.includes("xhr error") || errorMsg.includes("failed to fetch");
      
      if (isQuotaError || isRpcError) {
        if (isQuotaError) {
          // Rotate key
          currentKeyIndex = (currentKeyIndex + 1) % keys.length;
        }
        
        // If we've tried all keys or max retries, throw
        if (attempt === retries) {
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
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    // If it's a docx, we extract text and treat as raw text because Gemini doesn't support it as inlineData
    let finalRawText = rawText || "";
    let isNative = fileBase64 && mimeType && isNativeAiSupport(mimeType);
    
    if (fileBase64 && mimeType && !isNative && isSupportedMime(mimeType)) {
      const extracted = await extractDocxText(fileBase64);
      finalRawText = (finalRawText ? finalRawText + "\n\n" : "") + extracted;
    }

    const prompt = `FORENSIC CLONE ARCHITECT & PIXEL-PERFECT DESIGN ENGINEER.
    
    TASK: Extract the absolute STRUCTURAL DNA of this REFERENCE RESUME with 100% fidelity for A4 RECONSTRUCTION.
    
    EXTRACTION PROTOCOLS (NO APPROXIMATIONS):
    1. GEOMETRY & GRID:
       - Columns: Detect exact layout model (Single, 1:2 split, 2:1 split, Sidebar Left/Right).
       - Widths: Measure exact width percentages for all columns (e.g., "Sidebar: 30%, Main: 70%").
       - Gutters: Measure exact spacing between columns.
    2. TYPOGRAPHIC BLUEPRINT:
       - Fonts: Identify font category (Serif, Sans, Mono) and pairing.
       - Hierarchy: Identify exact weights (300 to 900) and relative sizes (H1, H2, Body, Subtext).
       - Leading: Detect line heights and paragraph spacing.
    3. VISUAL THEME:
       - Colors: Extract HEX codes for backgrounds, accents, and text.
       - Dividers: Identify divider styles (Solid lines, dashed, dots) and their positions (Top, Bottom, Left, Right).
       - Bullet Points: Identify the symbol or style used.
    
    OUTPUT: A technical "Layout Manifest" as a JSON-like object describing the physical structure. Return ONLY the manifest.`;

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
        maxOutputTokens: 2048,
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

  return withRetry(async (ai) => {
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
  return withRetry(async (ai) => {
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
  options: { lengthMode?: '1-page' | '2-page' | 'executive' } = {}
) {
  return withRetry(async (ai) => {
    const model = "gemini-3.1-pro-preview"; 
    
    const optimizationPrompt = jobDescription 
      ? `\n\nCONTENT MAPPING & AI OPTIMIZATION:
      1. Map USER DATA into the target sections with high semantic accuracy.
      2. Rewrite bullet points to include keywords from the JOB DESCRIPTION while preserving all factual data.
      3. Ensure EVERY segment of the job description is addressed in the rewritten content.`
      : "\n\nCONTENT MAPPING: Map USER DATA into the structural containers defined by the reference visual.";

    const layoutSystemPrompt = `
    LAYOUT SYSTEM SPECIFICATIONS (CLONING DIRECTIVE):
    - DETECT COLUMNS: If there is a sidebar, you MUST use a multi-column structure (Flexbox or CSS Grid). Calculate exact widths (e.g., sidebar w-[30%] vs main w-[70%]).
    - SPATIAL ACCURACY: Replicate headers, footers, and floating sidebars. Use absolute positioning ONLY if necessary, otherwise prefer Flex/Grid.
    - REPLICATE SHAPES: Use Tailwind classes for rounded corners (rounded-[...]px), borders (border-[...]), and color zones (bg-[#...]).
    - FONTS & COLORS: Use the analyzed HEX codes and font categories. 
    - INFOGRAPHIC ELEMENTS: If skills are shown as bars, use <div class="h-2 bg-gray-100 rounded-full"><div class="h-full bg-indigo-600 rounded-full" style="width: 80%"></div></div>.
    - ICONS & GRAPHICS: Use Lucide icons via <i data-lucide="..."></i> or equivalent SVG.
    - CONTAINER LOCK: The total width is 794px. Ensure the layout handles this fixed width gracefully with internal padding.
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
          : "";

    // Use full JSON for layout morphing to preserve maximum structural fidelity as requested
    const refText = reference.text || "";
    const userText = content.text || "";

    const prompt = `SUPREME FORENSIC MAPPING ENGINE & DATA INTEGRITY GUARDIAN.
    
    GOAL: Transform the USER CONTENT into the reference DNA layout with 100% visual fidelity and absolute data integrity.
    
    STRICT MAPPING PROTOCOLS:
    1. DNA TEMPLATE BINDING: 
       - You MUST use the column ratios, vertical spacing, and typographic scales extracted in the DNA analysis.
       - Sections MUST appear in the same order and visual hierarchy as the reference.
       - Match all decorative elements: Dividers (use border-bottom or border-top, NEVER text-decoration: underline for layout lines), horizontal/vertical lines, frames, bullet symbols, and HEX accent colors.
       - If the reference uses a vertical line to separate a sidebar, you MUST implement it using a border-l or border-r on the appropriate container.
    2. ZERO DATA LOSS (ABSOLUTE REQUIREMENT):
       - Extract EVERY piece of information from the user source document.
       - ALL Experience entries (Company, Role, Dates, ALL Bullet Points).
       - ALL Education history, ALL Skills categories and items.
       - ALL Projects, Certifications, Awards, and any Custom Sections.
       - TRUNCATION IS A FAILURE. If content exceeds a single page, allow the layout to expand vertically into multiple <div class="page"> blocks.
       - DO NOT Summarize or omit bullet points. If the user has 10 bullet points, you list 10 bullet points.
    3. PIXEL-PERFECT RENDER (STRICT):
       - Page Setup: Each page MUST be wrapped in:
         <div class="page" data-page="Page X of Y">
           <div class="content">
             [YOU INSERT CONTENT HERE]
           </div>
         </div>
       - Dimensions: Each .page block MUST be 794px width x 1123px height.
       - Margins: The .page container has fixed padding of 48px T/B and 56px L/R.
       - Content Height: Ensure content within a .content block does NOT exceed 1027px. If it does, safely move the rest to the NEXT page.
       - Layout Fidelity: Strictly mirror the Columns and Width ratios from the Manifest.
       - Layout Strategy (STRICT): 
         * Use CSS Grid or Flexbox for columns. Example: <div class="grid grid-cols-[1fr_2.5fr] gap-8">.
         * If the reference has a sidebar (Left or Right), YOU MUST REPLICATE IT EXACTLY.
       - Spacing: Use Tailwind w-full for sections to ensure they span the column width.
       - Section Headers: Replicate the styling (borders, bolding, capitalization) exactly as seen in the DNA.
       - Typography: Use the specified font categories (Sans, Serif, Mono).
    
    VALIDATION GATE:
    - Verify that NO experience entry was omitted.
    - If a section (like Skills) is on a sidebar in the reference, it MUST be on the sidebar in the output.
    - If content spans multiple pages, ENSURE the sidebar/layout structure is maintained across pages if the reference requires it.
    
    OUTPUT: A single self-contained HTML structure with Tailwind classes. No descriptions. Just code.
    
    ${optimizationPrompt}
    ${layoutSystemPrompt}
    ${atsMaxPrompt}
    ${lengthPrompt}
    
    TECHNICAL OUTPUT:
    - Return valid JSON.
    - JSON PROPERTY "html" MUST contain the full, adaptive, non-truncated resume structure.
    
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
      "extractedText": "...",
      "integrityMetrics": {
        "sourceFieldCount": ...,
        "renderedFieldCount": ...,
        "omittedFields": []
      }
    }`;

    const contents: any[] = [];
    const parts: any[] = [];

    // Add Reference Info - ALWAYS include visual if available and supported
    if (reference.base64 && reference.mimeType && isNativeAiSupport(reference.mimeType)) {
      parts.push({ 
        inlineData: { 
          data: reference.base64.split(',')[1] || reference.base64, 
          mimeType: reference.mimeType 
        } 
      });
      parts.push({ text: "### MASTER REFERENCE DOCUMENT (Visual & Layout Blueprint)" });
    } else if (reference.base64 && reference.mimeType && isSupportedMime(reference.mimeType)) {
      // Pre-process docx for reference too if needed
      const extracted = await extractDocxText(reference.base64);
      parts.push({ text: `### MASTER REFERENCE CONTENT (Extracted):\n${extracted}` });
    }

    if (existingLayout) {
      parts.push({ text: `### DESIGN TOKENS MANIFEST (Already Analyzed):\n${existingLayout}` });
    } else if (refText) {
      parts.push({ text: `### REFERENCE CONTENT STRUCTURE:\n${refText}` });
    }

    // Add User Content Info - include visual if supported for better data extraction
    if (content.base64 && content.mimeType && isNativeAiSupport(content.mimeType)) {
      parts.push({ 
        inlineData: { 
          data: content.base64.split(',')[1] || content.base64, 
          mimeType: content.mimeType 
        } 
      });
      parts.push({ text: "### USER CONTENT SOURCE (Reference for data extraction)" });
    } else if (content.base64 && content.mimeType && isSupportedMime(content.mimeType)) {
      const extracted = await extractDocxText(content.base64);
      parts.push({ text: `### USER CONTENT SOURCE (Extracted):\n${extracted}` });
    }
    
    if (userText) {
      parts.push({ text: `### USER RAW TEXT CONTENT (The facts to insert):\n${userText}` });
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
            extractedText: { type: Type.STRING },
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
          required: ["html", "name", "yoe", "profile", "atsScore", "atsFeedback", "matchScore", "missingKeywords", "layoutAnalysis", "extractedText", "integrityMetrics"]
        },
        temperature: 0.1,
      }
    });

    try {
      const text = extractJson(response.text || "");
      const parsed = JSON.parse(text);
      
      // Validation Layer
      if (parsed.integrityMetrics && parsed.integrityMetrics.omittedFields?.length > 0) {
        console.warn("Data Loss Detected in AI Morph:", parsed.integrityMetrics.omittedFields);
      }
      
      return parsed;
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
        extractedText: "",
        integrityMetrics: { sourceFieldCount: 0, renderedFieldCount: 0, omittedFields: [] }
      };
    }
  });
}

export async function checkMatch(resumeText: string, jobDescription: string) {
  return withRetry(async (ai) => {
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
  return withRetry(async (ai) => {
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
  return withRetry(async (ai) => {
    const model = "gemini-3.1-pro-preview"; 
    
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
        console.log('Successfully parsed TOON:', parsed);
        return parsed;
      }
      
      throw new Error("Invalid TOON structure");
    } catch (e) {
      console.warn("TOON parsing failed or invalid, attempting JSON fallback", e);
      try {
        const jsonText = extractJson(response.text || "");
        if (!jsonText) throw new Error("No valid JSON found in response");
        
        const jsonParsed = JSON.parse(jsonText);
        if (TOON.validateResumeData(jsonParsed)) {
          return jsonParsed;
        }
        throw new Error("JSON structure invalid for resume");
      } catch (jsonErr) {
        console.error("All parsing attempts failed", jsonErr);
        throw new Error("Failed to process resume data structure.");
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
    
    if (referenceBase64 && referenceMime && isSupportedMime(referenceMime)) {
      parts.push({
        inlineData: {
          data: referenceBase64.split(',')[1] || referenceBase64,
          mimeType: referenceMime
        }
      });
      parts.push({ text: "### REFERENCE VISUAL BLUEPRINT (Layout Source of Truth)" });
    }

    const dataJson = JSON.stringify(data);
    const stylesJson = JSON.stringify(styles);

    const prompt = `SUPREME FRONT-END DESIGN ENGINEER & CLONE ARCHITECT.
    
    TASK: Code a pixel-perfect, interactive RESUME using the visual blueprint and the provided JSON data.
    
    DATA SOURCE: ${dataJson}
    STYLE PREFERENCES: ${stylesJson}
    STRUCTURAL BLUEPRINT: ${referenceLayout || "Standard Professional"}
    
    CODING RULES (CLONING FIRST):
    1. STYLE: Use Tailwind CSS. THE STRUCTURAL BLUEPRINT IS THE MASTER. Replicate its visual structure (columns, placement, margin, padding) with 100% fidelity.
       - If the blueprint has a sidebar, the generated HTML MUST have a 2-column sidebar layout.
       - Match the visual weight: Use font-weight classes (font-black, font-bold, font-medium) to match the analyzed blueprint.
    2. THEMING: You MUST use CSS variables for dynamic styles:
       - Use 'var(--primary-color)' for all accent colors (icons, headers, borders, active bars).
       - Use 'var(--text-main)' for primary text.
       - Use 'var(--bg-card)' for section backgrounds if applicable.
    3. DATA BINDING (CRITICAL - 100% DATA PRESERVATION): 
       - INJECT 100% OF THE DATA FROM THE SOURCE. DO NOT SUMMARIZE, MERGE, OR OMIT ANY TEXT. EVERY BULLET POINT MUST BE RENDERED.
       - Add 'data-resume-field' to every element that displays data from the JSON.
       - Add a 'data-section-name' attribute to the container DIV of every major section.
    4. CUSTOMIZATION: Apply the Style Preferences provided while respecting the layout structure.
    5. INFOGRAPHIC ELEMENTS: Map skills to bars/pills based on the blueprint style.
    6. RESPONSIVENESS (A4 PRECISION): 
       - Design for a fixed 794px wide canvas (A4 at 96dpi).
       - Use EXACT internal padding from blueprint (or default to 50px 55px).
       - VERTICAL EXPANSION: Content MUST NOT wrap or truncate. Expand vertically to accommodate all user content.
       - RELATIVE PRECISION: Use exact percentage widths for columns (e.g., w-[32%] and w-[68%]) to match the blueprint exactly.
    
    NO DATA LOSS: Outputting a summary instead of full text is a failure.
    
    OUTPUT: Return ONLY a valid JSON object with the "html" key containing the Tailwind structure.`;

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
        temperature: 0.2,
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
