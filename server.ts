import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";

dotenv.config();

// Robust __dirname for both ESM and CJS
let __dirnameOverride: string;
try {
  // @ts-ignore - this works in CJS
  __dirnameOverride = __dirname;
} catch (e) {
  // This works in ESM
  const __filename = fileURLToPath(import.meta.url);
  __dirnameOverride = path.dirname(__filename);
}

const getRoot = () => process.cwd();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors());
  app.use(express.json());

  // API Status
  app.get("/api/health", (_req: Request, res: Response) => {
    res.json({ 
      status: "ok", 
      uptime: process.uptime(), 
      env: process.env.NODE_ENV,
      root: getRoot(),
      dir: __dirnameOverride
    });
  });

  // ... (rest of the API routes would be here, but I'll skip to the metadata/vite parts to keep the edit focused)

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
          // Dynamic import for pdf-parse to avoid ESM/CJS issues at startup
          const pdf = await import("pdf-parse");
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
          const mammoth = await import("mammoth");
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
  const getMetadata = (req: Request) => {
    const urlPath = req.originalUrl || '/';
    // Better host detection for Cloud Run / Proxies
    const forwardedHost = req.headers['x-forwarded-host'] as string;
    const host = forwardedHost || req.get('host') || 'resumemorph.ai';
    const protocol = (req.headers['x-forwarded-proto'] as string) || (req.secure ? 'https' : 'http');
    const baseUrl = `${protocol}://${host.split(',')[0].trim()}`.replace(/\/+$/, ""); // Ensure no trailing slash
    
    // Professional Brand Image
    const LOGO_IMAGE = "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=0.8&w=1200&h=630";

    const defaultMeta = {
      title: "Resume Morph AI | Transform Your Career with AI",
      description: "Morph your resume into any design with AI. Clone layouts from images, optimize for ATS, and chat with your resume architect to refine every detail.",
      image: LOGO_IMAGE,
      url: `${baseUrl}${urlPath.split('?')[0]}`.replace(/\/+$/, "") || baseUrl // Construct canonical URL safely
    };

    if (urlPath.includes('/portfolio')) {
      return {
        ...defaultMeta,
        title: "AI Portfolio Generator | Build Your Personal Brand | Resume Morph",
        description: "Instantly transform your resume into a stunning, responsive portfolio website. Showcase your work with style.",
        image: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }
    
    if (urlPath.includes('/smart-editor')) {
      return {
        ...defaultMeta,
        title: "Smart Resume Editor | ATS-Optimized Refinement",
        description: "Live ATS scoring and AI-powered content improvement. Ensure your resume passes every recruiter filter with ease.",
        image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    if (urlPath.includes('/tracker')) {
      return {
        ...defaultMeta,
        title: "Job Application Tracker | Organize Your Search",
        description: "Keep track of every resume sent, every interview scheduled, and every offer received in one central dashboard.",
        image: "https://images.unsplash.com/photo-1454165833767-027546981f6?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    if (urlPath.includes('/cover-letter')) {
      return {
        ...defaultMeta,
        title: "AI Cover Letter Generator | Personalized for Every Job",
        description: "Create compelling cover letters tailored specifically to each role and company in seconds.",
        image: "https://images.unsplash.com/photo-1512485696566-29a94a859464?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    if (urlPath.includes('/ai-assistant')) {
      return {
        ...defaultMeta,
        title: "AI Career Coach | Mock Interviews & Growth",
        description: "Level up your career with AI-driven mock interviews, feedback, and expert guidance from your Morph Career Coach.",
        image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    if (urlPath.includes('/guide') || urlPath.includes('/resources')) {
      return {
        ...defaultMeta,
        title: "Resources & Guide | Master the Morph Platform",
        description: "Everything you need to know about building the perfect resume and portfolio with Resume Morph AI.",
        image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    if (urlPath.includes('/about')) {
      return {
        ...defaultMeta,
        title: "About Resume Morph AI | The Future of Career Tech",
        description: "Learn about the mission and technology behind the platform that's helping thousands transform their careers.",
        image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=0.8&w=1200&h=630"
      };
    }

    return defaultMeta;
  };

  const injectMetadata = (html: string, metadata: any) => {
    return html
      .replace(/__TITLE__/g, () => String(metadata.title))
      .replace(/__DESCRIPTION__/g, () => String(metadata.description))
      .replace(/__IMAGE__/g, () => String(metadata.image))
      .replace(/__URL__/g, () => String(metadata.url));
  };

  let cachedTemplate: string | null = null;
  const getTemplate = (indexPath: string, vite?: any, url?: string) => {
    if (process.env.NODE_ENV !== "production") {
      let template = fs.readFileSync(indexPath, 'utf-8');
      if (vite && url) {
        return vite.transformIndexHtml(url, template);
      }
      return Promise.resolve(template);
    }
    
    if (cachedTemplate) return Promise.resolve(cachedTemplate);
    cachedTemplate = fs.readFileSync(indexPath, 'utf-8');
    return Promise.resolve(cachedTemplate);
  };

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    // Dynamic import to avoid crash in production if vite is missing
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    
    app.use(vite.middlewares);

    // Development path for metadata testing
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API and assets
      if (url.startsWith('/api') || url.includes('.')) return next();

      try {
        const indexPath = path.resolve(getRoot(), 'index.html');
        const template = await getTemplate(indexPath, vite, url);
        
        const metadata = getMetadata(req);
        const html = injectMetadata(template, metadata);
        
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // In production, server runs from dist/server.cjs
    // Assets are in the same folder (dist/)
    const distPath = path.resolve(__dirnameOverride); 
    console.log(`Serving static assets from: ${distPath}`);
    app.use(express.static(distPath, { index: false }));

    app.get('*', async (req, res, next) => {
      const url = req.originalUrl;
      // Skip API and assets that weren't caught by express.static
      if (url.startsWith('/api') || url.includes('.')) return next();

      const distIndex = path.join(distPath, 'index.html');
      
      try {
        let indexPath = distIndex;
        if (!fs.existsSync(distIndex)) {
            indexPath = path.join(process.cwd(), 'dist', 'index.html');
        }

        if (fs.existsSync(indexPath)) {
          const template = await getTemplate(indexPath);
          const metadata = getMetadata(req);
          const html = injectMetadata(template, metadata);
          res.set('Cache-Control', 'public, max-age=3600').send(html);
        } else {
          res.status(404).send('Application build not found. Please refresh.');
        }
      } catch (err) {
        console.error("Template read error:", err);
        res.status(500).send("Internal Server Error");
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
