# Resume Morph AI 🧬✨

Resume Morph is a high-fidelity style cloning engine. We bridge the structural gap between your expertise and your dream role's aesthetic with mathematical precision.

![Resume Morph Preview](https://res.cloudinary.com/dyksnjhyx/image/upload/v1781114996/oq2lql5xtwblfzrjvnzn.jpg)

## 🌐 Project Links

- **Live URL:** [https://resume-morph.vercel.app/](https://resume-morph.vercel.app/)
- **Repository Metadata:** Configured via `metadata.json` for AI Studio integration.

---

## 🚀 Key Features

- **High-Fidelity Layout Cloning:** Seamlessly match styling DNA from reference layout PDFs or images to render responsive, beautiful resumes.
- **Dynamic Previews:** A side-by-side split screen view with real-time responsive rendering, internal document scrolling, and height synchronized to the layout customization panel.
- **Robust Multi-file Extraction:** Parse baseline content from modern `PDF`, `DOCX`, `HTML`, `JSON`, or raw `TXT` inputs.
- **Smart Formatting Options:** Interactive controls to switch A4 page-bounds visualization, customize font parameters, zoom levels, and live-synchronize background save history.
- **Flawless Export Suites:** Export high-quality custom layouts straight to custom-rendered documents, Word-friendly XML layers, or professional print engines.

---

## 🛠️ Tech Stack

### Frontend & Rendering
- **React 19 & TypeScript:** Custom modular components with strict type-safety.
- **Tailwind CSS v4:** A fluid, modern, aesthetic interface utilizing native `@theme` variables and utility pairings.
- **Motion (motion/react):** Elegant micro-animations and staggered coordinate entries.
- **Lucide React:** A unified collection of clear line-art icons.
- **HTML-to-Image / jsPDF / html2canvas:** Client-side vector capturing and multipage PDF generation pipelines.

### Backend & AI Intelligence
- **Google Gen AI SDK (`@google/genai`):** Dynamic style extracting, semantic structure mapping, and AI-powered copy drafting using server-side Gemini models.
- **Express & Node.js:** A full-stack backend acting as a secure proxy API to process files and isolate keys.
- **Mammoth & PDF-Parse:** Server-side engines for processing text from uploaded resumes and target jobs.

### Storage & Database
- **Firebase Firestore & Authentication:** Secure accounts, high-speed query indexing, and automatic history syncing for user-saved resumes.
