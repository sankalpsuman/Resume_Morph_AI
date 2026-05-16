import express, { Request, Response } from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import mammoth from "mammoth";
import * as pdf from "pdf-parse";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Status
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  // Resume Text Extraction API
  app.post("/api/extract-text", upload.single("resume"), async (req: any, res: any) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      console.log(`Processing extraction: ${file.originalname} (${file.mimetype})`);

      let extractedText = "";
      const fileName = file.originalname.toLowerCase();

      // Case 1: PDF
      if (file.mimetype === "application/pdf" || fileName.endsWith('.pdf')) {
        try {
          // Robust pdf-parse usage for both ESM and CJS compatibility
          const pdfParser = (pdf as any).default || pdf;
          const data = await pdfParser(file.buffer);
          extractedText = data.text;
        } catch (pdfError) {
          console.error("PDF Parsing Error:", pdfError);
        }
      } 
      // Case 2: DOCX
      else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || 
        fileName.endsWith('.docx')
      ) {
        try {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          extractedText = result.value;
        } catch (docxError) {
          console.error("DOCX Parsing Error:", docxError);
        }
      }
      // Case 3: Text-based (txt, html, json, md)
      else if (
        file.mimetype.startsWith("text/") || 
        file.mimetype === "application/json" ||
        /\.(txt|html|htm|json|md)$/i.test(fileName)
      ) {
        extractedText = file.buffer.toString("utf-8");
      }

      // Cleanup text (remove excessive whitespace)
      const cleanText = extractedText.replace(/\s+/g, ' ').trim();

      if (!cleanText) {
        return res.json({ text: "", warning: "Extraction yielded empty result" });
      }

      console.log(`Extraction successful: ${cleanText.length} characters`);
      res.json({ text: cleanText });

    } catch (error: any) {
      console.error("Server Extraction Error:", error);
      res.status(500).json({ 
        error: "Server failed to process document",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // Dynamic Metadata Helper
  const getMetadata = (urlPath: string, host: string) => {
    // Determine base URL (handle localhost for dev convenience)
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;
    
    const defaultMeta = {
      title: "Resume Morph AI | Transform Your Career with AI",
      description: "Morph your resume into any design with AI. Clone layouts from images, optimize for ATS, and chat with your resume architect to refine every detail.",
      image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=0.8&w=1200&h=630&fit=crop",
      url: `${baseUrl}${urlPath}`
    };

    if (urlPath.includes('/portfolio')) {
      return {
        ...defaultMeta,
        title: "Portfolio Generator | Build Your Personal Brand | Resume Morph",
        description: "Instantly transform your resume into a stunning, responsive portfolio website with Resume Morph AI.",
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=0.8&w=1200&h=630&fit=crop"
      };
    }
    
    if (urlPath.includes('/smart-editor')) {
      return {
        ...defaultMeta,
        title: "Smart Editor | ATS-Optimized Resume Refining | Resume Morph",
        description: "Live ATS scoring and AI-powered content improvement. Ensure your resume passes every recruiter filter.",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=0.8&w=1200&h=630&fit=crop"
      };
    }

    if (urlPath.includes('/ai-assistant')) {
      return {
        ...defaultMeta,
        title: "AI Career Coach | Mock Interviews & Growth | Resume Morph",
        description: "Level up your career with AI-driven mock interviews, feedback, and expert guidance from your Morph Career Coach.",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=0.8&w=1200&h=630&fit=crop"
      };
    }

    return defaultMeta;
  };

  const injectMetadata = (html: string, metadata: any) => {
    return html
      .replace(/__TITLE__/g, metadata.title)
      .replace(/__DESCRIPTION__/g, metadata.description)
      .replace(/__IMAGE__/g, metadata.image)
      .replace(/__URL__/g, metadata.url);
  };

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    // Development path for metadata testing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        const metadata = getMetadata(url, req.get('host') || 'localhost:3000');
        const html = injectMetadata(template, metadata);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath, { index: false })); // Don't serve index.html automatically

    app.get('*', (req, res) => {
      const distIndex = path.join(distPath, 'index.html');
      if (fs.existsSync(distIndex)) {
        let template = fs.readFileSync(distIndex, 'utf-8');
        const metadata = getMetadata(req.originalUrl, req.get('host') || 'resumemorph.ai');
        const html = injectMetadata(template, metadata);
        res.send(html);
      } else {
        res.status(404).send('Not Found');
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`\n🚀 Morph Engine Server booting...`);
    console.log(`📌 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
