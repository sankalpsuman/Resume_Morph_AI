import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

function getAI() {
  const apiKey = 
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) || 
    (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (window as any).GEMINI_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeLayout(fileBase64?: string, mimeType?: string, rawText?: string) {
  const ai = getAI();
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
}

export async function extractTextFromAny(base64: string, mimeType: string) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  const prompt = "Extract all the text content from this resume precisely. Do not add any commentary.";
  const part = { inlineData: { data: base64, mimeType } };
  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [part, { text: prompt }] }],
  });
  return response.text;
}

export async function getOptimizationPlan(userContent: string, jobDescription?: string) {
  const ai = getAI();
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
      temperature: 0.1
    },
    contents: [{ parts: [{ text: prompt }] }],
  });

  try {
    return JSON.parse(response.text);
  } catch (e) {
    return ["Standardize headings", "Optimize keyword density", "Improve bullet point structure"];
  }
}

export async function generateResume(layoutDesc: string, userContent: string, jobDescription?: string, maximizeAts: boolean = false) {
  const ai = getAI();
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
      temperature: 0.1 // Lower temperature for faster, more consistent results
    },
    contents: [{ parts: [{ text: prompt }] }],
  });

  try {
    let text = response.text.trim();
    // Strip markdown blocks if present
    if (text.startsWith("```json")) {
      text = text.substring(7, text.length - 3).trim();
    } else if (text.startsWith("```")) {
      text = text.substring(3, text.length - 3).trim();
    }
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    // Fallback if JSON parsing fails
    return { html: response.text, name: "Resume", yoe: "0", profile: "Profile" };
  }
}
