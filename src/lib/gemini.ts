import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

function getAI() {
  // Try multiple ways to get the API key, prioritizing process.env as per guidelines
  // but falling back to other common locations in Vite/AI Studio environments.
  const apiKey = 
    (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined) || 
    (typeof process !== 'undefined' ? process.env?.API_KEY : undefined) ||
    ((import.meta as any).env?.VITE_GEMINI_API_KEY) ||
    (window as any).GEMINI_API_KEY ||
    "";

  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    throw new Error("API_KEY_MISSING");
  }
  return new GoogleGenAI({ apiKey });
}

export async function analyzeLayout(fileBase64: string, mimeType: string) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const prompt = `Analyze the visual and structural layout of this resume. 
  Describe in detail:
  1. Typography (font styles, weights, sizes for headers vs body).
  2. Layout (single column, double column, sidebar, margins, spacing).
  3. Visual elements (lines, icons, colors, bullet points style).
  4. Section organization (how sections like Experience, Education, Skills are visually separated).
  
  Provide a structured description that can be used to recreate this style in HTML/Tailwind CSS.`;

  const part = {
    inlineData: {
      data: fileBase64,
      mimeType: mimeType,
    },
  };

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [part, { text: prompt }] }],
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

export async function generateResume(layoutDesc: string, userContent: string, jobDescription?: string) {
  const ai = getAI();
  const model = "gemini-3-flash-preview";
  
  const optimizationPrompt = jobDescription 
    ? `\n\nOPTIMIZATION TARGET (Requirements/Context):\n${jobDescription}\n\nCRITICAL OPTIMIZATION RULES:
    1. ANALYZE the target requirements and MODIFY the USER CONTENT to align with them.
    2. DO NOT REMOVE any existing information, experiences, or details from the user's original content. Every project, role, and responsibility must be preserved.
    3. ONLY add or emphasize details that directly help the profile match the requirements (e.g., highlighting specific tools or methodologies already mentioned in the content).
    4. DO NOT add "extra skills", certifications, or experiences that the user does not explicitly have. Avoid hallucinating any information that would be hard to justify in an interview.
    5. Focus on rephrasing existing bullet points to use relevant keywords from the requirements, and adjust the emphasis of existing experiences to match the target role while remaining 100% truthful to the original content.`
    : "";

  const prompt = `You are an expert resume designer and career coach. 
  
  REFERENCE LAYOUT DESCRIPTION:
  ${layoutDesc}
  
  USER CONTENT TO FORMAT:
  ${userContent}${optimizationPrompt}
  
  TASK:
  1. Generate a high-fidelity, professional resume using HTML and Tailwind CSS that matches the REFERENCE LAYOUT exactly.
  2. Use the USER CONTENT provided. If an OPTIMIZATION TARGET is provided, follow the CRITICAL OPTIMIZATION RULES strictly: modify the content to align with the requirements without removing any original data or adding unsubstantiated skills.
  3. Extract the candidate's Name, Years of Experience (YOE), and Job Profile/Title.
  
  CRITICAL FILENAME METADATA RULES:
  - "name": The candidate's full name.
  - "yoe": Total years of professional experience.
  - "profile": This MUST be the primary professional domain or job title derived from the candidate's MOST RECENT and EXTENSIVE experience (e.g., "Full_Stack_Developer", "Marketing_Manager", "Data_Scientist"). Do not use generic terms like "Resume" or "Profile".
  
  REQUIREMENTS:
  - Use only Tailwind CSS classes for styling.
  - The output must be a single self-contained HTML <div> block.
  - Ensure the design is clean, professional, and readable.
  - Match the typography, spacing, and structure described in the layout analysis.
  - For better Word/PDF compatibility, prefer standard CSS properties (like padding, margin, font-size) within the Tailwind classes or as inline styles if necessary.
  - Return the result as a JSON object with the following keys:
    - "html": The generated HTML string.
    - "name": The candidate's full name (e.g., "John_Doe").
    - "yoe": The total years of experience (e.g., "5_Years").
    - "profile": The job title or profile (e.g., "Software_Engineer").
  
  Return ONLY the JSON object, no markdown blocks or extra text. Ensure the strings for name, yoe, and profile use underscores instead of spaces for filename compatibility.`;

  const response = await ai.models.generateContent({
    model,
    config: { responseMimeType: "application/json" },
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
