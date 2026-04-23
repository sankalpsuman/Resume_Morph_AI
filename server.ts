import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("GEMINI_API_KEY is not set. Smart Editor features will be disabled.");
  }

  // @ts-ignore
  const genAI = apiKey ? new GoogleGenAI({ apiKey }) : null;

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "Server is running" });
  });

  app.post("/api/smart-insert", upload.single("resume"), async (req, res) => {
    try {
      if (!genAI) {
        return res.status(503).json({ error: "AI service is not configured. Please check GEMINI_API_KEY." });
      }
      const { title, description } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ error: "No resume file uploaded" });
      }

      let resumeText = "";
      if (file.mimetype === "application/pdf") {
        const data = await pdf(file.buffer);
        resumeText = data.text;
      } else if (file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        resumeText = result.value;
      } else {
        resumeText = file.buffer.toString("utf-8");
      }

      const prompt = `
        You are an expert Resume Intelligence System.
        
        RESUME CONTENT:
        """
        ${resumeText}
        """
        
        NEW CONTENT TO INSERT:
        Title: ${title}
        Description: ${description}
        
        TASK:
        1. Parse the resume and identify sections (Experience, Projects, Skills, Education, Certifications).
        2. Classify the NEW CONTENT into the most appropriate section (Experience, Project, Skill, or Certification).
        3. Convert the NEW CONTENT into 2-4 professional, ATS-friendly bullet points using strong action verbs.
        4. Insert this new entry into the correct section of the resume.
        5. DO NOT rewrite the entire resume. Maintain the original formatting and style as much as possible.
        6. Wrap the newly inserted content in <mark class="new-content"> ... </mark> tags so it can be highlighted in the UI.
        7. If the section doesn't exist, create a minimal new section at an appropriate location.
        8. Return ONLY the updated resume text with the <mark> tags. No explanations.
      `;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: prompt }] }]
      });
      const updatedResume = result.text;

      res.json({ updatedResume });
    } catch (error) {
      console.error("Smart Insert Error:", error);
      res.status(500).json({ error: "Failed to process resume" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
