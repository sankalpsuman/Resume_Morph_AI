import { GoogleGenAI, GenerateContentResponse, Type, ThinkingLevel } from "@google/genai";

// Gemini supported multimodal types
const SUPPORTED_MIMES = [
  'application/pdf', 
  'image/png', 
  'image/jpeg', 
  'image/webp', 
  'image/heic', 
  'image/heif',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

function isSupportedMime(mime?: string) {
  if (!mime) return false;
  return SUPPORTED_MIMES.includes(mime.toLowerCase());
}

// Helper to extract JSON from a string that might contain extra text
function extractJson(text: string): string {
  // First, try to handle markdown code blocks
  const markdownMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (markdownMatch && markdownMatch[1]) {
    return markdownMatch[1].trim();
  }

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
    let candidate = text.substring(start, end + 1);
    // Cleanup trailing junk after the last closing brace if it's an object
    if (candidate.endsWith('}') || candidate.endsWith(']')) {
      return candidate;
    }
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
      const errorMsg = error?.message?.toLowerCase() || "";
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
    
    const prompt = `SUPREME DESIGN AUDITOR & SPATIAL ARCHITECT.
    
    TASK: Deconstruct this REFERENCE RESUME into a "High-Fidelity Implementation Manifest" for a web clone.
    
    AUDIT REQUIREMENTS (Identify EXACT dimensions and colors):
    1. SPATIAL GEOMETRY & GRID: 
       - Identify the layout engine (e.g., "Full-height left sidebar at 30% width", "Header block at 200px height with overflow profile image").
       - Calculate percentage-based zoning for all major sections.
    2. THEMATIC ATMOSPHERE:
       - Determine the exact HEX/RGB codes for ALL background layers, decorative borders, and text accents.
       - Identify "Atmospheric Effects": Drop shadows (\`shadow-lg\`), rounded corners (\`rounded-[40px]\`), or background gradients.
    3. TYPOGRAPHIC BLUEPRINT:
       - Mirror the "Typographic Personality": Is it Bold Modern, Classical Serif, or Technical Mono?
       - Define scale: Header size vs. Body size (e.g., "Main Header is 3xl, Section Header is xl with tracking-widest").
    4. COMPONENT ARCHITECTURE:
       - Detect specific "Design Elements": Bullet styles (checkboxes, arrows, dots), Divider styles (dot-dash, solid line thickness), and Icon placement.
       - Identify "Infographic Widgets": Skill progress bars, level meters, or timeline dots.
    5. DATA FLOW MAPPING:
       - Specify where "Experience", "Skills", and "Contact" reside visually.
    
    OUTPUT: A technical "Visual DNA Spec" (Tailwind tokens + Structural logic) that guarantees a 1:1 design clone.`;

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
  strict: boolean = true,
  options: { lengthMode?: '1-page' | '2-page' | 'executive' } = {}
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

    const lengthPrompt = options?.lengthMode === '1-page' 
      ? "\n\nSTRICT LENGTH CONSTRAINT: The output MUST fit on a single A4 page. Be extremely concise. Use compact spacing."
      : options?.lengthMode === '2-page'
        ? "\n\nLENGTH: Expand content to fill approximately 2 pages. More detail per role is expected."
        : options?.lengthMode === 'executive'
          ? "\n\nTHEME: High-level executive summary style. Focus on leadership and strategic impact."
          : "";

    const prompt = `SUPREME DESIGN SYSTEM ENGINEER.
    
    GOAL: Replicate the REFERENCE VISUAL's geometry, colors, and layout structure with 100% fidelity using Tailwind CSS.
    
    CORE COMMANDS (STRICT ENFORCEMENT):
    1. LAYOUT CLONING: 
       - You MUST build the exact same grid/flex structure as the reference. If there's a sidebar, replicate its relative width and background color exactly.
       - Use arbitrary Tailwind values for pixel-perfection: \`bg-[#...] \`, \`w-[...%]\`, \`p-[...px]\`.
    2. COMPONENT ARCHETYPES:
       - Mirror the "Design Language" of dividers, buttons, and skill displays.
       - If the reference uses "Infographic" styles (progress bars, rated dots, timelines), you MUST code them using div structures.
       - REPLICATE shapes like circular profile pics or rounded section boxes.
    3. DATA REMAPPING:
       - Pour USER CONTENT into the reference's visual slots. If the reference shows "Experience" as a multi-line entry with a logo, format the user's data the same way.
    4. ACCURACY & POLISH:
       - match font-weights, tracking, and leading of the reference.
       - Use Lucide icons or raw SVG for all icons/graphics.
       - Ensure exact color-matching for every text and background element.
    
    OUTPUT: A single self-contained HTML structure with Tailwind classes. No <html> or <body> tags. High complexity is expected.
    
    ADVANCED GRAPHICS DIRECTIVE: If the reference uses overlapping elements, negative margins, or layered images, you MUST implement them. Use \`z-index\`, \`relative/absolute\`, and \`overflow-hidden\` to achieve the high-graphic look. Do NOT simplify the design.
    
    ${optimizationPrompt}
    ${layoutSystemPrompt}
    ${atsMaxPrompt}
    ${lengthPrompt}
    
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
        temperature: 0.1,
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
    
    const prompt = `SUPREME PORTFOLIO ARCHITECT & BRAND STRATEGIST.
    
    RESUME DATA: ${resumeText}
    ${githubData ? `GITHUB REPOSITORIES: ${JSON.stringify(githubData)}` : ""}
    
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

export async function parseResumeToData(file: { base64: string; mimeType: string; text?: string }) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    const parts: any[] = [];
    
    if (file.base64 && isSupportedMime(file.mimeType)) {
      parts.push({
        inlineData: {
          data: file.base64.split(',')[1] || file.base64,
          mimeType: file.mimeType
        }
      });
    } else if (file.text) {
      parts.push({ text: `RAW TEXT:\n${file.text}` });
    }

    const prompt = `EXPERT RESUME CONTENT EXTRACTOR.
    
    TASK: Extract EVERY detail from this resume into a clean, structured JSON format.
    
    EXTRACTION RULES:
    1. Do not omit any professional data.
    2. Split names, titles, and contact info clearly.
    3. Categorize experience and projects with dates, company names, and bullet points.
    4. Group skills into categories if possible.
    
    JSON STRUCTURE:
    {
      "personalInfo": { "name": "...", "title": "...", "email": "...", "phone": "...", "location": "...", "links": { "linkedin": "...", "github": "...", "portfolio": "..." } },
      "summary": "...",
      "experience": [ { "company": "...", "role": "...", "dates": "...", "location": "...", "bullets": ["...", "..."] } ],
      "projects": [ { "name": "...", "description": "...", "tech": "...", "link": "..." } ],
      "education": [ { "school": "...", "degree": "...", "year": "..." } ],
      "skills": [ { "category": "...", "items": ["...", "..."] } ],
      "certifications": ["...", "..."],
      "customSections": [ { "title": "...", "content": "..." } ]
    }`;

    parts.push({ text: prompt });

    const response = await ai.models.generateContent({
      model,
      contents: [{ parts }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            personalInfo: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                title: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING },
                location: { type: Type.STRING },
                links: {
                  type: Type.OBJECT,
                  properties: {
                    linkedin: { type: Type.STRING },
                    github: { type: Type.STRING },
                    portfolio: { type: Type.STRING }
                  }
                }
              },
              required: ["name", "email"]
            },
            summary: { type: Type.STRING },
            experience: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  company: { type: Type.STRING },
                  role: { type: Type.STRING },
                  dates: { type: Type.STRING },
                  location: { type: Type.STRING },
                  bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["company", "role", "bullets"]
              }
            },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  tech: { type: Type.STRING },
                  link: { type: Type.STRING }
                },
                required: ["name", "description"]
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
                required: ["school", "degree"]
              }
            },
            skills: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  items: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ["category", "items"]
              }
            },
            certifications: { type: Type.ARRAY, items: { type: Type.STRING } },
            customSections: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            }
          },
          required: ["personalInfo", "summary", "experience", "skills"]
        },
        temperature: 0.1,
      }
    });

    try {
      const respText = response.text || "{}";
      return JSON.parse(extractJson(respText));
    } catch (e) {
      console.error("Failed to parse resume into JSON", e);
      throw new Error("Failed to process resume data structure.");
    }
  });
}

export async function generateCoverLetter(resumeText: string, jobTitle: string, company?: string, jobDescription?: string) {
  return withRetry(async (ai) => {
    const model = "gemini-3-flash-preview";
    
    const prompt = `Expert Career Coach & Copywriter.
    
    RESUME: ${resumeText}
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
    const model = "gemini-3-flash-preview";
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

    const prompt = `SUPREME FRONT-END DESIGN ENGINEER.
    
    TASK: Code a pixel-perfect, interactive RESUME using the visual blueprint and the provided JSON data.
    
    DATA SOURCE: ${JSON.stringify(data)}
    STYLE PREFERENCES: ${JSON.stringify(styles)}
    STRUCTURAL BLUEPRINT: ${referenceLayout || "Standard Professional"}
    
    CODING RULES:
    1. STYLE: Use Tailwind CSS with absolute fidelity to the Reference Visual.
    2. THEMING: You MUST use CSS variables for dynamic styles:
       - Use 'var(--primary-color)' for all accent colors (icons, headers, borders).
       - Use 'var(--text-main)' for primary text.
       - Use 'var(--bg-card)' for section backgrounds if applicable.
    3. DATA BINDING: 
       - Add 'data-resume-field' to every element that displays data from the JSON.
       - Add a 'data-section-name' attribute to the container DIV of every major section (e.g., 'Summary', 'Experience', 'Projects', 'Education', 'Skills', 'Certifications').
       - Use dot notation for paths (e.g., 'personalInfo.name', 'experience.0.company').
    4. CUSTOMIZATION: Apply the Style Preferences provided.
    5. INFOGRAPHIC ELEMENTS: Map skills to bars/pills. Use SVG/Lucide icons.
    6. RESPONSIVENESS: Ensure it looks perfect on A4 size.
    
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

    const prompt = `You are a career change analyst. Compare these two versions of a resume and summarize the key textual differences and improvements. 
    Focus on how the AI "Morphed" or improved the content.
    
    OLD VERSION (RAW):
    ${oldResume.substring(0, 5000)}
    
    NEW VERSION (GENERATED):
    ${newResume.substring(0, 5000)}
    
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
