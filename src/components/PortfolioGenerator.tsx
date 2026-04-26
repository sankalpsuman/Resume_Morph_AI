import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Github, 
  Linkedin, 
  Globe, 
  Loader2, 
  CheckCircle, 
  Eye, 
  Edit3, 
  Layout, 
  Rocket, 
  Plus, 
  Trash2, 
  ChevronRight,
  ExternalLink,
  Code,
  Briefcase,
  User,
  Mail,
  Wand2,
  FileText,
  X,
  Download,
  Sparkles,
  ArrowRight,
  Monitor,
  Tablet,
  Smartphone,
  Layers,
  Key,
  Settings,
  Printer,
  Maximize2,
  Minimize2,
  Check,
  FileCode,
  ChevronDown,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { cn } from '../lib/utils';
import { extractTextFromAny, generatePortfolioContent } from '../lib/gemini';
import { PortfolioContent, PortfolioTemplate } from '../types';

interface GenerationStep {
  id: string;
  label: string;
  status: 'pending' | 'loading' | 'completed' | 'error';
}

interface PortfolioGeneratorProps {
  onFullscreenChange?: (isFullscreen: boolean) => void;
}

export default function PortfolioGenerator({ onFullscreenChange }: PortfolioGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [portfolio, setPortfolio] = useState<PortfolioContent | null>(null);
  const [template, setTemplate] = useState<PortfolioTemplate>('minimal');
  const [isEditing, setIsEditing] = useState(false);
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isRecruiterView, setIsRecruiterView] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [globalFontSize, setGlobalFontSize] = useState(100); // Percentage
  const [globalFontFamily, setGlobalFontFamily] = useState('Inter');
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'export'>('design');
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [previewScale, setPreviewScale] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [selectedElement, setSelectedElement] = useState<{ path: string, label: string } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<{ id: number; label: string; status: 'pending' | 'loading' | 'complete' }[]>([]);

  const generateStaticHTML = () => {
    if (!portfolio) return '';

    const templateStyles = {
      minimal: `
        :root { --text: #171717; --muted: #a3a3a3; --bg: #fdfdfb; }
        body { font-family: 'Playfair Display', serif; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1100px; margin: 0 auto; padding: 100px 40px; }
        header { border-bottom: 2px solid var(--text); padding-bottom: 60px; margin-bottom: 80px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
        h1 { font-size: clamp(4rem, 12vw, 10rem); font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 0.85; }
        .headline { font-size: 2.5rem; color: var(--muted); font-style: italic; margin-top: 40px; }
        .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; }
        section { margin-bottom: 80px; }
        h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.4em; margin-bottom: 40px; font-weight: 900; }
        .skill-item { font-size: 1.5rem; font-weight: bold; border-bottom: 1px solid #e5e5e5; padding: 16px 0; }
        .exp-item { margin-bottom: 80px; }
        .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
        .exp-header h3 { font-size: 3rem; margin: 0; font-weight: 900; }
        .role { font-size: 1.5rem; color: var(--muted); font-style: italic; margin-bottom: 24px; }
        .skill-tag { display: inline-block; padding: 8px 16px; border: 1px solid var(--text); border-radius: 100px; margin: 4px; font-weight: bold; font-size: 0.875rem; }
        .project-card { border: 1px solid #e5e5e5; padding: 40px; border-radius: 24px; }
        @media (max-width: 768px) {
          header, .main-grid { grid-template-columns: 1fr; }
          h1 { font-size: 5rem; }
        }
      `,
      developer: `
        :root { --primary: #00ff88; --bg: #050505; --text: #ffffff; }
        body { font-family: 'JetBrains Mono', monospace; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 60px 40px; display: grid; grid-template-columns: 350px 1fr; gap: 80px; }
        h1 { font-size: 4rem; font-weight: 800; margin: 0 0 20px 0; color: var(--primary); }
        .headline { font-size: 1.25rem; color: #888; margin-bottom: 40px; }
        section { margin-bottom: 60px; }
        h3 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.3em; color: var(--primary); margin-bottom: 30px; }
        .skill-tag { display: inline-block; padding: 4px 12px; border: 1px solid #333; border-radius: 4px; margin: 4px; font-size: 0.75rem; color: #888; }
        .exp-item { margin-bottom: 40px; border-left: 2px solid #222; padding-left: 30px; }
        .role { font-size: 1.5rem; font-weight: bold; margin-bottom: 8px; }
        .project-card { background: #111; padding: 30px; border-radius: 12px; border: 1px solid #222; margin-bottom: 20px; }
        @media (max-width: 1024px) {
          .container { grid-template-columns: 1fr; }
        }
      `,
      professional: `
        :root { --text: #171717; --muted: #737373; --bg: #ffffff; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1000px; margin: 0 auto; padding: 80px 40px; }
        header { border-bottom: 2px solid var(--text); padding-bottom: 60px; margin-bottom: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { font-size: 5rem; font-weight: 900; margin: 0; letter-spacing: -0.05em; }
        .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; }
        h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.4em; margin-bottom: 40px; font-weight: 900; }
        .skill-item { font-size: 1.25rem; font-weight: bold; border-bottom: 1px solid #e5e5e5; padding: 12px 0; }
        .exp-item { margin-bottom: 60px; }
        .exp-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; }
        .exp-header h3 { font-size: 2rem; margin: 0; font-weight: 800; }
        .role { font-size: 1.25rem; color: var(--muted); font-style: italic; margin-bottom: 20px; }
        @media (max-width: 768px) {
          header { flex-direction: column; align-items: flex-start; gap: 20px; }
          .main-grid { grid-template-columns: 1fr; }
        }
      `,
      modern: `
        :root { --primary: #4f46e5; --bg: #f8f9ff; --text: #171717; }
        body { font-family: 'Inter', sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 80px 40px; }
        h1 { font-size: clamp(4rem, 10vw, 9rem); font-weight: 800; margin: 0 0 40px 0; letter-spacing: -0.05em; line-height: 0.85; }
        .headline { font-size: clamp(1.5rem, 4vw, 3.5rem); color: #6b7280; font-weight: 500; margin-bottom: 80px; }
        .bento-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 32px; }
        .card { background: white; padding: 48px; border-radius: 48px; box-shadow: 0 20px 50px rgba(79,70,229,0.05); border: 1px solid #f1f5f9; }
        .span-8 { grid-column: span 8; }
        .span-4 { grid-column: span 4; }
        .span-12 { grid-column: span 12; }
        .label { font-size: 0.75rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.3em; color: var(--primary); margin-bottom: 32px; display: block; }
        @media (max-width: 1024px) {
          .span-8, .span-4 { grid-column: span 12; }
          .bento-grid { gap: 24px; }
        }
      `
    };

    const getTemplateHTML = () => {
      if (template === 'developer') {
        return `
          <div class="container">
            <aside>
              <h1>${portfolio.hero.name}</h1>
              <p class="headline">${portfolio.hero.headline}</p>
              <p>${portfolio.about}</p>
              <div style="margin-top: 40px">
                <h3>Skills</h3>
                ${portfolio.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
              </div>
            </aside>
            <main>
              <section>
                <h3>Experience</h3>
                ${portfolio.experience.map(exp => `
                  <div class="exp-item">
                    <div class="role">${exp.role}</div>
                    <div style="font-weight: bold; margin-bottom: 16px">${exp.company} | ${exp.duration}</div>
                    <ul>${exp.description.map(d => `<li>${d}</li>`).join('')}</ul>
                  </div>
                `).join('')}
              </section>
              <section>
                <h3>Projects</h3>
                ${portfolio.projects.map(p => `
                  <div class="project-card">
                    <h3>${p.title}</h3>
                    <p>${p.description}</p>
                    <div style="margin-top: 16px">${p.tech.map(t => `<span class="skill-tag">${t}</span>`).join('')}</div>
                  </div>
                `).join('')}
              </section>
            </main>
          </div>
        `;
      }

      if (template === 'professional') {
        return `
          <div class="container">
            <header>
              <h1>${portfolio.hero.name}</h1>
              <div style="text-align: right">
                <p style="font-weight: bold">${portfolio.contact.email}</p>
                <p>${portfolio.hero.headline}</p>
              </div>
            </header>
            <div class="main-grid">
              <aside>
                <section>
                  <h2>Expertise</h2>
                  ${portfolio.skills.map(s => `<div class="skill-item">${s}</div>`).join('')}
                </section>
                <section>
                  <h2>Education</h2>
                  ${portfolio.education.map(edu => `
                    <div style="margin-bottom: 32px">
                      <div style="font-weight: 900; font-size: 1.25rem">${edu.school}</div>
                      <div style="font-style: italic; color: #737373">${edu.degree}</div>
                      <div style="font-size: 0.75rem; font-weight: 900; margin-top: 8px">${edu.year}</div>
                    </div>
                  `).join('')}
                </section>
              </aside>
              <main>
                <section>
                  <h2>Narrative</h2>
                  <p style="font-size: 2rem; font-weight: 300">${portfolio.about}</p>
                </section>
                <section>
                  <h2>Experience</h2>
                  ${portfolio.experience.map(exp => `
                    <div class="exp-item">
                      <div class="exp-header">
                        <h3>${exp.company}</h3>
                        <span>${exp.duration}</span>
                      </div>
                      <div class="role">${exp.role}</div>
                      <ul>${exp.description.map(d => `<li>${d}</li>`).join('')}</ul>
                    </div>
                  `).join('')}
                </section>
              </main>
            </div>
          </div>
        `;
      }

      if (template === 'modern') {
        return `
          <div class="container">
            <header>
              <h1>${portfolio.hero.name}</h1>
              <p class="headline">${portfolio.hero.headline}</p>
            </header>
            <div class="bento-grid">
              <div class="card span-8">
                <span class="label">About</span>
                <p style="font-size: 2rem; font-weight: 500">${portfolio.about}</p>
                <div style="margin-top: 40px">
                  ${portfolio.skills.map(s => `<span style="display: inline-block; padding: 8px 16px; background: #f8f9ff; border-radius: 12px; margin: 4px; font-weight: bold; font-size: 0.875rem">${s}</span>`).join('')}
                </div>
              </div>
              <div class="card span-4" style="background: #4f46e5; color: white">
                <span class="label" style="color: #c7d2fe">Connect</span>
                <p style="font-size: 1.5rem; font-weight: bold">${portfolio.contact.email}</p>
                <p style="margin-top: 20px">Let's build something amazing together.</p>
              </div>
              ${portfolio.projects.map((p, i) => `
                <div class="card ${i % 3 === 0 ? 'span-8' : 'span-4'}">
                  <span class="label">Project</span>
                  <h3 style="font-size: 2rem; margin: 0 0 16px 0">${p.title}</h3>
                  <p style="color: #6b7280">${p.description}</p>
                </div>
              `).join('')}
              <div class="card span-12">
                <span class="label">Experience</span>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px">
                  ${portfolio.experience.map(exp => `
                    <div>
                      <h3 style="font-size: 1.5rem; margin: 0 0 8px 0">${exp.company}</h3>
                      <p style="color: #4f46e5; font-weight: bold; margin-bottom: 16px">${exp.role}</p>
                      <p style="font-size: 0.875rem; color: #6b7280">${exp.duration}</p>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      }

      // Default/Minimal
      return `
        <div class="container">
          <header>
            <h1>${portfolio.hero.name}</h1>
            <p class="headline">${portfolio.hero.headline}</p>
          </header>
          <section>
            <h2>01 / About</h2>
            <p style="font-size: 2rem; font-weight: 500">${portfolio.about}</p>
          </section>
          <section>
            <h2>02 / Expertise</h2>
            <div>${portfolio.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}</div>
          </section>
          <section>
            <h2>03 / Experience</h2>
            <div>
              ${portfolio.experience.map(exp => `
                <div class="exp-item">
                  <div style="display: flex; justify-content: space-between; align-items: baseline">
                    <h3 style="font-size: 2.5rem; margin: 0">${exp.company}</h3>
                    <span style="color: #a3a3a3; font-family: monospace">${exp.duration}</span>
                  </div>
                  <p class="role">${exp.role}</p>
                  <ul>${exp.description.map(d => `<li>${d}</li>`).join('')}</ul>
                </div>
              `).join('')}
            </div>
          </section>
          <section>
            <h2>04 / Projects</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px">
              ${portfolio.projects.map(p => `
                <div class="project-card">
                  <h3 style="font-size: 1.75rem; margin: 0 0 16px 0">${p.title}</h3>
                  <p>${p.description}</p>
                  <div style="margin-top: 24px">${p.tech.map(t => `<span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: #a3a3a3; margin-right: 12px">${t}</span>`).join('')}</div>
                </div>
              `).join('')}
            </div>
          </section>
        </div>
      `;
    };

    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${portfolio.hero.name} | Portfolio</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;800;900&family=JetBrains+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,900;1,400&display=swap" rel="stylesheet">
        <style>
          ${templateStyles[template as keyof typeof templateStyles] || templateStyles.minimal}
          footer { margin-top: 120px; padding: 40px 0; border-top: 1px solid #e5e5e5; display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: bold; text-transform: uppercase; letter-spacing: 0.2em; color: #a3a3a3; }
          @media (max-width: 768px) {
            footer { flex-direction: column; gap: 20px; text-align: center; }
          }
        </style>
      </head>
      <body>
        ${getTemplateHTML()}
        <div class="container" style="padding-top: 0; padding-bottom: 40px">
          <footer>
            <span>© ${new Date().getFullYear()} ${portfolio.hero.name}</span>
            <span>Built with AI Studio</span>
          </footer>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('portfolio-preview-content');
    if (!element || !portfolio) return;

    setIsPrinting(true);
    setLoadingSteps([
      { id: 1, label: 'Optimizing layout for PDF...', status: 'loading' },
      { id: 2, label: 'Capturing high-resolution assets...', status: 'pending' },
      { id: 3, label: 'Generating document structure...', status: 'pending' }
    ]);

    try {
      // Small delay to ensure any layout shifts are settled and styles are applied
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setLoadingSteps(prev => prev.map(s => s.id === 1 ? { ...s, status: 'complete' } : s.id === 2 ? { ...s, status: 'loading' } : s));

      const canvas = await htmlToImage.toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: template === 'developer' ? '#050505' : '#ffffff',
        width: element.scrollWidth,
        height: element.scrollHeight,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: `${element.scrollWidth}px`,
          height: `${element.scrollHeight}px`,
          overflow: 'visible'
        }
      });
      
      setLoadingSteps(prev => prev.map(s => s.id === 2 ? { ...s, status: 'complete' } : s.id === 3 ? { ...s, status: 'loading' } : s));

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [element.scrollWidth, element.scrollHeight]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, element.scrollWidth, element.scrollHeight);
      pdf.save(`${portfolio.hero.name.replace(/\s+/g, '-').toLowerCase()}-portfolio.pdf`);

      setLoadingSteps(prev => prev.map(s => s.id === 3 ? { ...s, status: 'complete' } : s));
      setTimeout(() => setLoadingSteps([]), 2000);
    } catch (err) {
      console.error('PDF generation error:', err);
      window.print();
      setLoadingSteps([]);
    } finally {
      setIsPrinting(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    // Small delay to ensure the notification is visible before the print dialog blocks the UI
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 1000);
  };
  const [deploymentKeys, setDeploymentKeys] = useState({
    vercelToken: '',
    githubToken: '',
    customDomain: '',
    projectName: ''
  });
  const [showDeploymentSettings, setShowDeploymentSettings] = useState(false);
  
  const [steps, setSteps] = useState<GenerationStep[]>([
    { id: 'parse', label: 'Parsing Resume', status: 'pending' },
    { id: 'enhance', label: 'Enhancing Content', status: 'pending' },
    { id: 'github', label: 'Fetching Projects', status: 'pending' },
    { id: 'generate', label: 'Generating Website', status: 'pending' },
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateStepStatus = (id: string, status: GenerationStep['status']) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setResumeFile(file);
  };

  const fetchGitHubProjects = async (username: string) => {
    try {
      const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
      if (!response.ok) return [];
      const repos = await response.json();
      return repos
        .filter((repo: any) => !repo.fork)
        .slice(0, 3)
        .map((repo: any) => ({
          title: repo.name,
          description: repo.description || 'No description provided.',
          tech: [repo.language].filter(Boolean),
          github: repo.html_url,
          link: repo.homepage || undefined
        }));
    } catch (err) {
      console.error('GitHub fetch error:', err);
      return [];
    }
  };

  const handleGenerate = async () => {
    if (!resumeFile && !githubUsername && !linkedinUrl) {
      setError('Please provide at least one source (Resume, GitHub, or LinkedIn)');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setDeployedUrl(null);
    
    // Reset steps
    setSteps(prev => prev.map(s => ({ ...s, status: 'pending' })));

    try {
      let resumeText = '';
      
      // Step 1: Parse Resume
      if (resumeFile) {
        updateStepStatus('parse', 'loading');
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
          reader.readAsDataURL(resumeFile);
        });
        const base64 = await base64Promise;
        resumeText = await extractTextFromAny(base64, resumeFile.type);
        updateStepStatus('parse', 'completed');
      } else {
        updateStepStatus('parse', 'completed');
      }

      // Step 2: Fetch Projects
      updateStepStatus('github', 'loading');
      let githubProjects = [];
      if (githubUsername) {
        githubProjects = await fetchGitHubProjects(githubUsername);
      }
      updateStepStatus('github', 'completed');

      // Step 3 & 4: Enhance & Generate
      updateStepStatus('enhance', 'loading');
      updateStepStatus('generate', 'loading');
      
      const content = await generatePortfolioContent(resumeText || `User with GitHub: ${githubUsername}`, githubProjects);
      
      setPortfolio(content);
      updateStepStatus('enhance', 'completed');
      updateStepStatus('generate', 'completed');
      
    } catch (err: any) {
      setError(err.message || 'An error occurred during generation');
      setSteps(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeploy = () => {
    if (!portfolio) return;
    
    // In a real app, this would use the deploymentKeys to trigger a Vercel/GitHub deployment
    if (deploymentKeys.vercelToken) {
      console.log('Deploying to Vercel with token:', deploymentKeys.vercelToken.substring(0, 5) + '...');
    }

    const slug = portfolio.hero.name.toLowerCase().replace(/\s+/g, '-');
    setDeployedUrl(`${slug}.portfolio.site`);
  };

  const handleDownloadSource = () => {
    if (!portfolio) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(portfolio, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "portfolio-data.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="relative overflow-hidden selection:bg-indigo-100 selection:text-indigo-900 font-sans px-4 py-12 md:py-20 rounded-[32px] md:rounded-[40px] bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-sm relative">
      {/* Atmospheric Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-200/20 dark:bg-indigo-900/10 blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-violet-200/20 dark:bg-violet-900/10 blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-fuchsia-100/10 blur-[100px]" />
      </div>

      {/* Print Notification */}
      <AnimatePresence>
        {isPrinting && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[200] bg-neutral-900/90 backdrop-blur-xl text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-4 font-display font-bold ring-1 ring-white/20"
          >
            <Printer className="w-5 h-5 animate-pulse text-indigo-400" />
            <span className="text-sm tracking-tight">Generating high-fidelity PDF...</span>
          </motion.div>
        )}
      </AnimatePresence>
<div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* Hero Header */}
        <header className="max-w-4xl mb-12 lg:mb-28 mt-8 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-color)] text-indigo-600 dark:text-indigo-400 text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] mb-6 md:mb-8 shadow-sm"
          >
            <Sparkles className="w-3 md:w-3.5 h-3 md:h-3.5" />
            AI Portfolio Builder
          </motion.div>
          <h1 className="text-4xl sm:text-5xl lg:text-8xl font-display font-bold tracking-tight text-[var(--text-primary)] mb-6 md:mb-8 leading-[1.1] md:leading-[0.95]">
            Your career, <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">beautifully presented.</span>
          </h1>
          <p className="text-lg lg:text-2xl text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl px-1 md:px-0">
            Transform your resume into a professional portfolio website in seconds. No code, just your story.
          </p>
        </header>

        {!portfolio && !isGenerating && (
          <>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-24"
            >
              {/* Bento Grid: Main Inputs */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                {/* Resume Upload - Large Cell */}
                <div className="md:col-span-2 group bg-[var(--bg-primary)] rounded-3xl md:rounded-5xl p-6 md:p-12 shadow-sm border border-[var(--border-color)] hover:border-indigo-500/50 dark:hover:border-indigo-400/50 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                    <FileText className="w-24 md:w-32 h-24 md:h-32 rotate-12 text-[var(--text-primary)]" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8 md:mb-10">
                      <div>
                        <span className="text-[9px] md:text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-2 block font-display">Step 01</span>
                        <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
                          Upload Resume
                        </h2>
                      </div>
                      <div className="px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[9px] md:text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest shrink-0">Required</div>
                    </div>
                    
                    <div className={cn(
                      "relative border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-20 text-center cursor-pointer transition-all duration-500 overflow-hidden group/drop",
                      resumeFile 
                        ? "border-green-500/30 bg-green-500/5" 
                        : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-500/30 hover:bg-indigo-500/5"
                    )}>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx"
                      />
                      
                      <AnimatePresence mode="wait">
                        {resumeFile ? (
                          <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-16 md:w-20 h-16 md:h-20 bg-green-100 dark:bg-green-900/30 rounded-3xl flex items-center justify-center mb-5 md:mb-6 shadow-sm">
                              <CheckCircle className="w-8 md:w-10 h-8 md:h-10 text-green-600 dark:text-green-400" />
                            </div>
                            <p className="text-[var(--text-primary)] font-display font-bold text-xl md:text-2xl mb-1.5 md:mb-2 truncate max-w-full px-4">{resumeFile.name}</p>
                            <p className="text-[var(--text-secondary)] text-xs md:text-sm font-medium mb-6 md:mb-8">{(resumeFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            <button className="px-6 md:px-8 py-2.5 md:py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl md:rounded-2xl text-[13px] md:text-sm font-bold hover:bg-[var(--bg-secondary)] transition-all shadow-sm active:scale-95">
                              Change File
                            </button>
                          </motion.div>
                        ) : (
                          <motion.div 
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex flex-col items-center"
                          >
                            <div className="w-16 md:w-20 h-16 md:h-20 bg-[var(--bg-primary)] rounded-2xl md:rounded-3xl shadow-sm border border-[var(--border-color)] flex items-center justify-center mb-6 md:mb-8 group-hover/drop:scale-110 group-hover/drop:rotate-3 transition-transform duration-500">
                              <Upload className="w-8 md:w-10 h-8 md:h-10 text-[var(--text-tertiary)]" />
                            </div>
                            <p className="text-[var(--text-primary)] font-display font-bold text-xl md:text-2xl mb-2.5 md:mb-3">Drop your resume here</p>
                            <p className="text-[var(--text-secondary)] max-w-xs mx-auto font-medium leading-relaxed text-sm">
                              Support for PDF, DOCX, and DOC. <br className="hidden xs:block" />
                              Max file size 5MB.
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Social Connections - Bento Cell */}
                <div className="md:col-span-2 bg-[var(--bg-primary)] rounded-3xl md:rounded-5xl p-6 md:p-12 shadow-sm border border-[var(--border-color)]">
                  <div className="flex items-center justify-between mb-8 md:mb-10">
                    <div>
                      <span className="text-[9px] md:text-[10px] font-bold text-violet-600 dark:text-violet-400 uppercase tracking-[0.2em] mb-2 block font-display">Step 02</span>
                      <h2 className="text-2xl md:text-3xl font-display font-bold text-[var(--text-primary)] flex items-center gap-3">
                        Connect Socials
                      </h2>
                    </div>
                    <div className="px-2.5 py-1 rounded-full bg-[var(--bg-secondary)] text-[9px] md:text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest shrink-0">Optional</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                        <Github className="w-3 md:w-3.5 h-3 md:h-3.5" /> GitHub Username
                      </label>
                      <div className="relative group/input">
                        <input 
                          type="text" 
                          value={githubUsername}
                          onChange={(e) => setGithubUsername(e.target.value)}
                          placeholder="e.g. janesmith"
                          className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] text-sm md:text-base"
                        />
                      </div>
                    </div>
                    <div className="space-y-3 md:space-y-4">
                      <label className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                        <Linkedin className="w-3 md:w-3.5 h-3 md:h-3.5" /> LinkedIn URL
                      </label>
                      <div className="relative group/input">
                        <input 
                          type="text" 
                          value={linkedinUrl}
                          onChange={(e) => setLinkedinUrl(e.target.value)}
                          placeholder="linkedin.com/in/janesmith"
                          className="w-full px-5 md:px-6 py-3.5 md:py-4 rounded-xl md:rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-[var(--text-primary)] font-medium placeholder:text-[var(--text-tertiary)] text-sm md:text-base"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Sidebar - Bento Style */}
              <div className="lg:col-span-4 space-y-6 md:space-y-8">
                <div className="sticky top-28 space-y-6 md:space-y-8">
                  <div className="bg-neutral-900 dark:bg-neutral-800/50 rounded-3xl md:rounded-5xl p-8 md:p-10 text-white shadow-2xl relative overflow-hidden group border border-white/10">
                    <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-48 md:w-64 h-48 md:h-64 bg-indigo-500/20 blur-[80px] rounded-full group-hover:bg-indigo-500/30 transition-colors duration-700" />
                    
                    <div className="relative z-10">
                      <span className="text-[9px] md:text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] mb-4 block font-display">Ready to launch?</span>
                      <h3 className="text-3xl md:text-4xl font-display font-bold mb-4 md:mb-6 leading-tight text-white">Build your <br />future.</h3>
                      <p className="text-neutral-400 mb-8 md:mb-12 leading-relaxed font-medium text-sm">
                        Our AI will analyze your background and build a custom portfolio in seconds.
                      </p>
                      
                      <button 
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="w-full bg-white text-neutral-900 py-4.5 md:py-6 rounded-xl md:rounded-2xl font-bold text-base md:text-lg hover:bg-neutral-50 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-black/20"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-5 md:w-6 h-5 md:h-6 animate-spin" />
                        ) : (
                          <>
                            Generate Portfolio
                            <ArrowRight className="w-4 md:w-5 h-4 md:h-5" />
                          </>
                        )}
                      </button>
                      
                      {error && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-6 md:mt-8 p-4 md:p-5 bg-red-500/10 border border-red-500/20 rounded-xl md:rounded-2xl flex gap-3"
                        >
                          <X className="w-4 md:w-5 h-4 md:h-5 text-red-400 shrink-0 mt-0.5" />
                          <p className="text-red-200 text-xs md:text-sm leading-snug font-medium">{error}</p>
                        </motion.div>
                      )}
                    </div>
                  </div>
                  {/* Deployment Settings - Refined */}
                  <div className="bg-[var(--bg-primary)] rounded-3xl md:rounded-5xl p-6 md:p-8 border border-[var(--border-color)] shadow-sm">
                    <button 
                      onClick={() => setShowDeploymentSettings(!showDeploymentSettings)}
                      className="w-full flex items-center justify-between group"
                    >
                      <h4 className="font-display font-bold text-[var(--text-primary)] text-base md:text-lg flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors">
                          <Settings className="w-4 md:w-5 h-4 md:h-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Deployment Config
                      </h4>
                      <ChevronRight className={cn("w-4 md:w-5 h-4 md:h-5 text-[var(--text-tertiary)] transition-transform", showDeploymentSettings && "rotate-90")} />
                    </button>
                    
                    <AnimatePresence>
                      {showDeploymentSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-6 md:pt-8 space-y-4 md:space-y-6">
                            <div className="space-y-2 md:space-y-3">
                              <label className="text-[9px] md:text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                                <Key className="w-3 h-3" /> Vercel API Token
                              </label>
                              <input 
                                type="password"
                                value={deploymentKeys.vercelToken}
                                onChange={(e) => setDeploymentKeys(prev => ({ ...prev, vercelToken: e.target.value }))}
                                placeholder="sk_..."
                                className="w-full px-5 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-tertiary)]"
                              />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-2 ml-1">
                                <Rocket className="w-3 h-3" /> Project Name
                              </label>
                              <input 
                                type="text"
                                value={deploymentKeys.projectName}
                                onChange={(e) => setDeploymentKeys(prev => ({ ...prev, projectName: e.target.value }))}
                                placeholder="my-awesome-portfolio"
                                className="w-full px-5 py-3.5 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] focus:bg-[var(--bg-primary)] focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all outline-none text-[var(--text-primary)] text-sm font-medium placeholder:text-[var(--text-tertiary)]"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="bg-[var(--bg-primary)] rounded-5xl p-8 border border-[var(--border-color)] shadow-sm">
                    <h4 className="font-display font-bold text-[var(--text-primary)] mb-8 text-lg">What's included:</h4>
                    <ul className="space-y-6">
                      {[
                        { text: 'AI-powered content enhancement', icon: Wand2 },
                        { text: 'GitHub project integration', icon: Code },
                        { text: '3 professional templates', icon: Layout },
                        { text: 'Mobile-responsive design', icon: Smartphone },
                        { text: 'One-click deployment', icon: Rocket }
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-[var(--text-secondary)]">
                          <div className="p-2 bg-[var(--bg-secondary)] rounded-xl mt-0.5">
                            <item.icon className="w-4 h-4 text-[var(--text-tertiary)]" />
                          </div>
                          <span className="text-sm font-medium leading-relaxed">{item.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>
              </div>
            </motion.div>

            {/* How it's built section */}
            <motion.section 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-5xl mx-auto mb-32"
            >
              <div className="text-center mb-16">
                <h2 className="text-4xl font-display font-bold text-[var(--text-primary)] mb-4">How it's built</h2>
                <p className="text-[var(--text-secondary)] font-medium">A peek under the hood of this AI-powered engine.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  {
                    title: "Gemini 2.0 Flash",
                    description: "The core intelligence that parses your resume and generates high-quality, professional content tailored to your career.",
                    icon: Sparkles,
                    color: "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                  },
                  {
                    title: "React & Tailwind",
                    description: "A high-performance frontend stack ensuring your portfolio is lightning fast, responsive, and easy to customize.",
                    icon: Code,
                    color: "bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
                  },
                  {
                    title: "Dynamic Templates",
                    description: "Hand-crafted design systems that adapt to your content, ensuring a unique look for every professional.",
                    icon: Layout,
                    color: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                  }
                ].map((feature, i) => (
                  <div key={i} className="bg-[var(--bg-primary)] p-10 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm hover:shadow-xl transition-all duration-500 group">
                    <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform", feature.color)}>
                      <feature.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-4">{feature.title}</h3>
                    <p className="text-[var(--text-secondary)] text-sm leading-relaxed font-medium">{feature.description}</p>
                  </div>
                ))}
              </div>
            </motion.section>
          </>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="max-w-4xl mx-auto py-24 lg:py-32 text-center relative z-10">
            <div className="relative inline-block mb-20">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[120px] rounded-full animate-pulse" />
              <div className="relative w-40 h-40 bg-[var(--bg-primary)] rounded-5xl shadow-2xl border border-[var(--border-color)] flex items-center justify-center">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin" />
              </div>
            </div>
            
            <h2 className="text-5xl lg:text-6xl font-display font-bold text-[var(--text-primary)] mb-6 tracking-tight">Building your <br />professional story</h2>
            <p className="text-[var(--text-secondary)] text-xl mb-16 font-medium">Our AI is analyzing your background and crafting a unique experience...</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto text-left">
              {steps.map((step, idx) => (
                <motion.div 
                  key={step.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "flex items-center justify-between p-8 rounded-4xl border transition-all duration-700",
                    step.status === 'completed' 
                      ? "bg-green-50/50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20" 
                      : step.status === 'loading'
                        ? "bg-[var(--bg-primary)] border-indigo-100 dark:border-indigo-900 shadow-xl shadow-indigo-500/5 ring-4 ring-indigo-500/5"
                        : "bg-[var(--bg-primary)]/50 border-[var(--border-color)] opacity-40 text-[var(--text-tertiary)]"
                  )}
                >
                  <div className="flex items-center gap-5">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                      step.status === 'completed' ? "bg-green-500 text-white shadow-lg shadow-green-200" : "bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                    )}>
                      {step.status === 'completed' ? <CheckCircle className="w-6 h-6" /> : <Layers className="w-6 h-6" />}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-1 block">Step 0{idx + 1}</span>
                      <span className={cn(
                        "font-display font-bold text-lg",
                        step.status === 'completed' ? "text-green-700 dark:text-green-400" : "text-[var(--text-primary)]"
                      )}>
                        {step.label}
                      </span>
                    </div>
                  </div>
                  {step.status === 'loading' && <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />}
                  {step.status === 'error' && <X className="w-5 h-5 text-red-500" />}
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Preview View */}
        {portfolio && !isGenerating && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            {/* Controls Bar - Moved to Side Panel or kept as minimal floating if preferred, but user asked for panel */}
            <div className={cn(
              "sticky top-6 z-[210] transition-all duration-500 px-6",
              (isFullscreen || isEditing) ? "hidden" : ""
            )}>
              <div className="max-w-fit mx-auto bg-[var(--bg-primary)]/80 backdrop-blur-xl border border-[var(--border-color)] p-2 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-none flex items-center gap-2">
                <button 
                  onClick={() => setPortfolio(null)}
                  className="p-3 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all text-[var(--text-tertiary)] hover:text-red-600 group"
                  title="Discard and Start Over"
                >
                  <Trash2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                </button>
                
                <div className="h-8 w-px bg-[var(--border-color)] mx-1" />
                
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "flex items-center gap-2 px-6 py-2.5 rounded-2xl font-bold transition-all shadow-sm text-sm",
                    isEditing 
                      ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200" 
                      : "bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
                  )}
                >
                  {isEditing ? <CheckCircle className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                  {isEditing ? 'Finish Editing' : 'Edit Portfolio'}
                </button>

                <div className="h-8 w-px bg-[var(--border-color)] mx-1" />

                <button 
                  onClick={() => {
                    const nextVal = !isFullscreen;
                    setIsFullscreen(nextVal);
                    onFullscreenChange?.(nextVal);
                  }}
                  className="p-3 hover:bg-[var(--bg-secondary)] rounded-2xl transition-all text-[var(--text-tertiary)]"
                  title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Fullscreen Controls */}
            {isFullscreen && (
              <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 bg-[var(--bg-primary)]/90 backdrop-blur-2xl border border-[var(--border-color)] p-2 rounded-[2rem] shadow-2xl">
                <button 
                  onClick={() => setIsFullscreen(false)}
                  className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  title="Exit Fullscreen"
                >
                  <Minimize2 className="w-5 h-5" />
                </button>
                <div className="h-8 w-px bg-[var(--border-color)]" />
                <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl">
                  {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                    <button
                      key={device}
                      onClick={() => setPreviewDevice(device)}
                      className={cn(
                        "p-2 rounded-lg transition-all",
                        previewDevice === device ? "bg-[var(--bg-primary)] text-indigo-600 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                      )}
                    >
                      {device === 'desktop' ? <Monitor className="w-4 h-4" /> : device === 'tablet' ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
                <div className="h-8 w-px bg-[var(--border-color)]" />
                <button 
                  onClick={() => setIsEditing(!isEditing)}
                  className={cn(
                    "p-3 rounded-2xl transition-all",
                    isEditing ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-[var(--bg-secondary)] text-[var(--text-tertiary)]"
                  )}
                  title={isEditing ? "Close Editor" : "Open Editor"}
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            )}
        
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4">
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-xl",
              isEditing 
                ? "bg-indigo-600 text-white hover:bg-indigo-700" 
                : "bg-[var(--bg-primary)] text-[var(--text-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-secondary)]"
            )}
          >
            {isEditing ? <CheckCircle className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
            {isEditing ? 'Save Changes' : 'Edit Content'}
          </button>
        </div>

            {/* Deployed Notice */}
            <AnimatePresence>
              {deployedUrl && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginBottom: 40 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] flex flex-wrap items-center justify-between gap-8 shadow-2xl shadow-indigo-200">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-lg border border-white/20">
                        <Rocket className="w-8 h-8" />
                      </div>
                      <div>
                        <h4 className="font-bold text-2xl mb-1">Your portfolio is live!</h4>
                        <p className="text-indigo-100 text-lg">Your professional story is now accessible globally.</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 bg-white/10 p-2 rounded-3xl border border-white/10 backdrop-blur-sm">
                      <div className="px-6 py-3 font-mono text-lg font-bold">
                        {deployedUrl}
                      </div>
                      <button className="p-4 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all shadow-lg">
                        <ExternalLink className="w-6 h-6" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Analytics Dashboard */}
            <AnimatePresence>
              {showAnalytics && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-[var(--bg-primary)] rounded-[2.5rem] p-10 border border-[var(--border-color)] shadow-[0_8px_30px_rgb(0,0,0,0.04)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10"
                >
                  {[
                    { label: 'Total Views', value: '1,284', change: '+12%', color: 'indigo' },
                    { label: 'Project Clicks', value: '432', change: '+5%', color: 'violet' },
                    { label: 'Resume Downloads', value: '89', change: '+18%', color: 'emerald' },
                    { label: 'Avg. Session', value: '2m 14s', change: '-2%', color: 'amber' },
                  ].map((stat, i) => (
                    <div key={i} className="space-y-2">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--text-tertiary)]">{stat.label}</p>
                      <div className="flex items-baseline gap-3">
                        <span className="text-4xl font-bold text-[var(--text-primary)] tracking-tight">{stat.value}</span>
                        <div className={cn(
                          "px-2 py-1 rounded-lg text-xs font-black",
                          stat.change.startsWith('+') ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400"
                        )}>
                          {stat.change}
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: '70%' }}
                          transition={{ delay: i * 0.1, duration: 1 }}
                          className={cn(
                            "h-full rounded-full",
                            stat.color === 'indigo' ? "bg-indigo-500" :
                            stat.color === 'violet' ? "bg-violet-500" :
                            stat.color === 'emerald' ? "bg-emerald-500" : "bg-amber-500"
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Portfolio Preview Container - Browser Frame */}
            <div className="flex flex-1 overflow-hidden relative">
              <div className={cn(
                "flex-1 transition-all duration-500 overflow-auto",
                isEditing && !isFullscreen ? "mr-80 md:mr-96" : ""
              )}>
                <div className={cn(
                  "relative group/preview transition-all duration-500 min-h-screen flex flex-col items-center",
                  isFullscreen ? "fixed inset-0 z-[999] bg-[var(--bg-secondary)] p-6 pt-24 overflow-auto" : "p-6 md:p-12 lg:p-20"
                )}>
                  <div className={cn(
                    "w-full transition-all duration-500 origin-top flex flex-col items-center",
                    previewDevice === 'desktop' ? "max-w-full" : 
                    previewDevice === 'tablet' ? "max-w-[768px]" : "max-w-[375px]"
                  )}>
                    <div className="absolute -inset-4 bg-gradient-to-br from-indigo-500/10 via-transparent to-violet-500/10 blur-2xl rounded-5xl opacity-0 group-hover/preview:opacity-100 transition-opacity duration-1000" />
                    <div className={cn(
                      "relative bg-white dark:bg-neutral-900 rounded-4xl shadow-[0_40px_100px_rgba(0,0,0,0.1)] border border-[var(--border-color)] overflow-hidden ring-1 ring-black/[0.05] w-full",
                      previewDevice === 'mobile' ? "aspect-[9/19.5] max-h-[800px]" : 
                      previewDevice === 'tablet' ? "aspect-[3/4] max-h-[900px]" : "min-h-[80vh]"
                    )}>
                      {/* Browser Header */}
                      <div id="portfolio-preview-header" className="bg-[var(--bg-secondary)] border-b border-[var(--border-color)] px-6 py-4 flex items-center justify-between sticky top-0 z-20 backdrop-blur-md">
                        <div className="flex gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-400/40" />
                          <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-400/40" />
                          <div className="w-3 h-3 rounded-full bg-green-400/20 border border-green-400/40" />
                        </div>
                        <div className="bg-[var(--bg-primary)] border border-[var(--border-color)] px-4 py-1 rounded-lg text-[10px] font-medium text-[var(--text-tertiary)] flex items-center gap-2 min-w-[200px] justify-center shadow-sm">
                          <Globe className="w-3 h-3 text-indigo-500" />
                          {portfolio.hero.name.toLowerCase().replace(/\s+/g, '-')}.portfolio.site
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => setAutoFit(!autoFit)}
                            className={cn(
                              "p-1.5 rounded-lg transition-all",
                              autoFit ? "bg-indigo-600 text-white" : "text-[var(--text-tertiary)] hover:bg-[var(--bg-primary)]"
                            )}
                            title="Auto-fit content"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div id="portfolio-preview" className="relative overflow-auto h-[calc(100%-57px)]" style={{ 
                        fontSize: `${globalFontSize}%`,
                        fontFamily: globalFontFamily === 'Inter' ? '"Inter", sans-serif' : 
                                   globalFontFamily === 'Playfair' ? '"Playfair Display", serif' : 
                                   '"JetBrains Mono", monospace'
                      }}>
                        <div id="portfolio-preview-content" className={cn(
                          "w-full h-full transition-transform duration-500 origin-top",
                          autoFit && previewDevice !== 'desktop' ? "scale-[0.85] md:scale-100" : ""
                        )}>
                          <PortfolioPreview 
                            content={portfolio} 
                            template={template} 
                            isEditing={isEditing} 
                            isRecruiterView={isRecruiterView}
                            selectedElement={selectedElement}
                            onSelectElement={(el) => setSelectedElement(el)}
                            onChange={(updated) => setPortfolio(updated)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side Edit Panel */}
              <AnimatePresence>
                {isEditing && (
                  <motion.div
                    initial={{ x: 400 }}
                    animate={{ x: 0 }}
                    exit={{ x: 400 }}
                    className={cn(
                      "fixed top-24 right-6 bottom-6 w-80 md:w-96 bg-[var(--bg-primary)] rounded-[2.5rem] shadow-2xl border border-[var(--border-color)] flex flex-col overflow-hidden z-[1001]",
                      isFullscreen && "top-24"
                    )}
                  >
                    {/* Panel Header */}
                    <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-secondary)]/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-xl">
                          <Edit3 className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-bold text-[var(--text-primary)]">Portfolio Editor</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setPortfolio(null)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors text-[var(--text-tertiary)] hover:text-red-600"
                          title="Discard Portfolio"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => setIsEditing(false)}
                          className="p-2 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors text-[var(--text-tertiary)]"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-[var(--border-color)]">
                      {(['design', 'content', 'export'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={cn(
                            "flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all",
                            activeTab === tab ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/30" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                          )}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>

                    {/* Panel Content */}
                    <div className="flex-1 overflow-auto p-6 space-y-8 scrollbar-hide">
                      {activeTab === 'design' && (
                        <>
                          {/* Template Selection */}
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Template</label>
                            <div className="grid grid-cols-2 gap-2">
                              {(['minimal', 'developer', 'professional', 'modern'] as const).map((t) => (
                                <button
                                  key={t}
                                  onClick={() => setTemplate(t)}
                                  className={cn(
                                    "px-3 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                                    template === t ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200" : "bg-[var(--bg-primary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:border-indigo-200"
                                  )}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Family */}
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Typography</label>
                            <div className="space-y-2">
                              {(['Inter', 'Playfair', 'Mono'] as const).map((f) => (
                                <button
                                  key={f}
                                  onClick={() => setGlobalFontFamily(f)}
                                  className={cn(
                                    "w-full px-4 py-3 rounded-xl text-sm font-bold transition-all border flex items-center justify-between",
                                    globalFontFamily === f ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 text-indigo-600 dark:text-indigo-400" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)] hover:border-indigo-200"
                                  )}
                                >
                                  <span style={{ fontFamily: f === 'Inter' ? 'Inter' : f === 'Playfair' ? 'Playfair Display' : 'JetBrains Mono' }}>
                                    {f === 'Inter' ? 'Modern Sans' : f === 'Playfair' ? 'Elegant Serif' : 'Technical Mono'}
                                  </span>
                                  {globalFontFamily === f && <CheckCircle className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Font Size */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Scale</label>
                              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-md">{globalFontSize}%</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setGlobalFontSize(Math.max(70, globalFontSize - 5))}
                                className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-primary)]"
                              >
                                <Minus className="w-4 h-4" />
                              </button>
                              <input 
                                type="range" 
                                min="70" 
                                max="150" 
                                value={globalFontSize} 
                                onChange={(e) => setGlobalFontSize(parseInt(e.target.value))}
                                className="flex-1 accent-indigo-600"
                              />
                              <button 
                                onClick={() => setGlobalFontSize(Math.min(150, globalFontSize + 5))}
                                className="p-2 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded-lg transition-colors text-[var(--text-primary)]"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Device Preview */}
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Preview Device</label>
                            <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl">
                              {(['desktop', 'tablet', 'mobile'] as const).map((device) => (
                                <button
                                  key={device}
                                  onClick={() => setPreviewDevice(device)}
                                  className={cn(
                                    "flex-1 flex items-center justify-center py-2 rounded-lg transition-all",
                                    previewDevice === device ? "bg-[var(--bg-primary)] text-indigo-600 shadow-sm" : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                                  )}
                                >
                                  {device === 'desktop' ? <Monitor className="w-4 h-4" /> : device === 'tablet' ? <Tablet className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {activeTab === 'content' && (
                        <div className="space-y-6">
                          {selectedElement ? (
                            <div className="space-y-4 p-5 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-900/20">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400">Editing: {selectedElement.label}</span>
                                <button onClick={() => setSelectedElement(null)} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                <textarea 
                                  value={selectedElement.path.split('.').reduce((o, i) => o[i], portfolio as any)}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const newPortfolio = { ...portfolio };
                                    const keys = selectedElement.path.split('.');
                                    let current: any = newPortfolio;
                                    for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
                                    current[keys[keys.length - 1]] = val;
                                    setPortfolio(newPortfolio);
                                  }}
                                  className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-2xl p-4 text-sm font-medium focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 outline-none min-h-[120px] resize-none"
                                  placeholder="Enter content..."
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30">
                              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 mb-2">
                                <Sparkles className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">AI Tip</span>
                              </div>
                              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">Click on any text in the preview to edit it directly. Your changes are saved in real-time.</p>
                            </div>
                          )}
                          
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">Recruiter View</label>
                            <button
                              onClick={() => setIsRecruiterView(!isRecruiterView)}
                              className={cn(
                                "w-full flex items-center justify-between p-4 rounded-2xl border transition-all",
                                isRecruiterView ? "bg-indigo-600 border-indigo-600 text-white" : "bg-[var(--bg-primary)] border-[var(--border-color)] text-[var(--text-secondary)]"
                              )}
                            >
                              <span className="text-sm font-bold">Show Insights</span>
                              <div className={cn(
                                "w-10 h-5 rounded-full relative transition-colors",
                                isRecruiterView ? "bg-white/20" : "bg-[var(--bg-secondary)]"
                              )}>
                                <div className={cn(
                                  "absolute top-1 w-3 h-3 rounded-full bg-white transition-all",
                                  isRecruiterView ? "right-1" : "left-1"
                                  )} />
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {activeTab === 'export' && (
                        <div className="space-y-4">
                          <button 
                            onClick={handleDownloadPDF}
                            className={cn(
                              "w-full flex items-center gap-3 p-4 rounded-2xl transition-all text-left",
                              isPrinting ? "bg-indigo-600 text-white" : "bg-indigo-50 dark:bg-indigo-900/10 hover:bg-indigo-100 dark:hover:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                            )}
                            disabled={isPrinting}
                          >
                            <div className="p-2 bg-[var(--bg-primary)] rounded-xl shadow-sm">
                              {isPrinting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">Download PDF</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">Professional resume format</p>
                            </div>
                          </button>

                          <button 
                            onClick={() => setShowSourceCode(true)}
                            className="w-full flex items-center gap-3 p-4 bg-[var(--bg-secondary)] hover:bg-[var(--border-color)] rounded-2xl transition-all text-left border border-[var(--border-color)]"
                          >
                            <div className="p-2 bg-[var(--bg-primary)] rounded-xl shadow-sm">
                              <Code className="w-4 h-4 text-[var(--text-secondary)]" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">Source Code</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">Get JSON configuration</p>
                            </div>
                          </button>

                          <button 
                            onClick={() => {
                              if (!portfolio) return;
                              const htmlContent = generateStaticHTML();
                              const blob = new Blob([htmlContent], { type: 'text/html' });
                              const url = URL.createObjectURL(blob);
                              const downloadAnchorNode = document.createElement('a');
                              downloadAnchorNode.setAttribute("href", url);
                              downloadAnchorNode.setAttribute("download", `${portfolio.hero.name.toLowerCase().replace(/\s+/g, '-')}-portfolio.html`);
                              document.body.appendChild(downloadAnchorNode);
                              downloadAnchorNode.click();
                              downloadAnchorNode.remove();
                              URL.revokeObjectURL(url);
                              setShowExportOptions(false);
                            }}
                            className="w-full flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-2xl transition-all text-left border border-emerald-100 dark:border-emerald-900/20"
                          >
                            <div className="p-2 bg-[var(--bg-primary)] rounded-xl shadow-sm">
                              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-[var(--text-primary)]">Export HTML</p>
                              <p className="text-[10px] text-[var(--text-tertiary)]">Download standalone file</p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Panel Footer */}
                    <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Save & Close
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PDF Generation Loading Overlay */}
            <AnimatePresence>
              {loadingSteps.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--bg-primary)]/80 backdrop-blur-xl"
                >
                  <div className="w-full max-w-md p-12 bg-[var(--bg-primary)] rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-[var(--border-color)]">
                    <div className="flex items-center gap-4 mb-12">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                        <Printer className="w-6 h-6 text-white animate-pulse" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold tracking-tight text-[var(--text-primary)]">Generating PDF</h3>
                        <p className="text-sm text-[var(--text-tertiary)] font-medium tracking-tight">Please stay on this page</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {loadingSteps.map((step) => (
                        <div key={step.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500",
                              step.status === 'complete' ? "bg-green-500" : step.status === 'loading' ? "bg-indigo-600" : "bg-[var(--bg-secondary)]"
                            )}>
                              {step.status === 'complete' ? (
                                <Check className="w-3 h-3 text-white" />
                              ) : step.status === 'loading' ? (
                                <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                              ) : null}
                            </div>
                            <span className={cn(
                              "text-sm font-bold tracking-tight transition-colors duration-500",
                              step.status === 'complete' ? "text-[var(--text-primary)]" : step.status === 'loading' ? "text-indigo-600 dark:text-indigo-400" : "text-[var(--text-tertiary)]"
                            )}>
                              {step.label}
                            </span>
                          </div>
                          {step.status === 'loading' && (
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              className="h-1 bg-indigo-100 dark:bg-indigo-900/20 rounded-full overflow-hidden w-24"
                            >
                              <motion.div
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                                className="h-full bg-indigo-600 w-1/2"
                              />
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Source Code Modal */}
            <AnimatePresence>
              {showSourceCode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowSourceCode(false)}
                    className="absolute inset-0 bg-black/60 backdrop-blur-md"
                  />
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-5xl bg-neutral-900 rounded-4xl shadow-2xl border border-white/10 overflow-hidden flex flex-col max-h-full"
                  >
                    <div className="p-6 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 rounded-xl">
                          <Code className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <h3 className="text-white font-bold">Portfolio Source Code</h3>
                          <p className="text-xs text-neutral-500">React + Tailwind CSS Implementation</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setShowSourceCode(false)}
                        className="p-2 hover:bg-white/10 rounded-xl text-neutral-400 transition-colors"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6 font-mono text-sm">
                      <pre className="text-indigo-300 bg-black/40 p-6 rounded-2xl border border-white/5 overflow-x-auto whitespace-pre-wrap">
                        {`// Generated Portfolio Component\n// Template: ${template}\n\nimport React from 'react';\nimport { Github, Linkedin, Mail, ExternalLink, ArrowRight } from 'lucide-react';\n\nexport default function Portfolio() {\n  return (\n    <div className="min-h-screen bg-white text-neutral-900">\n      {/* This is a simplified version of your generated portfolio code */}\n      {/* You can use the JSON config to recreate the full experience */}\n      <header className="max-w-5xl mx-auto py-24 px-10">\n        <h1 className="text-7xl font-bold mb-6">${portfolio.hero.name}</h1>\n        <p className="text-3xl text-neutral-400">${portfolio.hero.headline}</p>\n      </header>\n      \n      <main className="max-w-5xl mx-auto px-10 pb-24">\n        <section className="mb-20">\n          <h2 className="text-xs uppercase tracking-widest text-neutral-300 mb-8">About</h2>\n          <p className="text-2xl leading-relaxed">${portfolio.about}</p>\n        </section>\n        \n        {/* ... more sections ... */}\n      </main>\n    </div>\n  );\n}`}
                      </pre>
                    </div>
                    <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
                      <button 
                        onClick={handleDownloadSource}
                        className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download JSON Config
                      </button>
                      <button 
                        onClick={() => {
                          if (portfolio) {
                            navigator.clipboard.writeText(JSON.stringify(portfolio, null, 2));
                          }
                        }}
                        className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Copy JSON
                      </button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function PortfolioPreview({ 
  content, 
  template, 
  isEditing, 
  isRecruiterView,
  selectedElement,
  onSelectElement,
  onChange 
}: { 
  content: PortfolioContent; 
  template: PortfolioTemplate; 
  isEditing: boolean;
  isRecruiterView: boolean;
  selectedElement: { path: string, label: string } | null;
  onSelectElement: (el: { path: string, label: string } | null) => void;
  onChange: (updated: PortfolioContent) => void;
}) {
  const updateField = (path: string, value: any) => {
    const newContent = { ...content };
    const keys = path.split('.');
    let current: any = newContent;
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    onChange(newContent);
  };

  const EditableText = ({ value, onSave, className, multiline = false, path, label }: any) => {
    const isSelected = selectedElement?.path === path;

    if (!isEditing) return <span className={className}>{value}</span>;
    
    return (
      <div 
        className={cn(
          "relative group/edit w-full transition-all cursor-text",
          isSelected ? "ring-2 ring-indigo-500 ring-offset-4 rounded-lg" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 rounded-lg"
        )}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement({ path, label });
        }}
      >
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onSave(e.target.value)}
            className={cn(
              "w-full bg-transparent border-none focus:outline-none transition-all text-inherit resize-none py-1",
              className
            )}
            rows={Math.max(1, value.split('\n').length)}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onSave(e.target.value)}
            className={cn(
              "w-full bg-transparent border-none focus:outline-none transition-all text-inherit py-1",
              className
            )}
          />
        )}
        <div className="absolute -top-6 right-0 opacity-0 group-hover/edit:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-indigo-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-widest shadow-lg flex items-center gap-1">
            <Edit3 className="w-2 h-2" />
            Edit {label}
          </div>
        </div>
      </div>
    );
  };

  if (template === 'minimal') {
    return (
      <div className="font-sans text-neutral-900 min-h-screen bg-white">
        <div className="max-w-5xl mx-auto py-16 lg:py-40 px-6 md:px-10">
          <header className="mb-24 lg:mb-40">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl lg:text-[10rem] font-bold mb-8 lg:mb-12 tracking-tighter leading-[0.85]"
            >
              <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </motion.h1>
            <div className="flex flex-wrap items-end justify-between gap-8 lg:gap-12">
              <p className="text-2xl lg:text-5xl text-neutral-400 max-w-3xl leading-[1.1] tracking-tight font-medium">
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </p>
              <div className="flex gap-6 lg:gap-8">
                {content.contact.github && <a href={content.contact.github} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Github className="w-6 h-6 lg:w-8 lg:h-8" /></a>}
                {content.contact.linkedin && <a href={content.contact.linkedin} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Linkedin className="w-6 h-6 lg:w-8 lg:h-8" /></a>}
                <a href={`mailto:${content.contact.email}`} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Mail className="w-6 h-6 lg:w-8 lg:h-8" /></a>
              </div>
            </div>
          </header>

          <section className="mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">01 / About</h2>
            </div>
            <div className="lg:col-span-8">
              <div className={cn(
                "text-xl lg:text-4xl leading-snug text-neutral-800 font-medium tracking-tight",
                isRecruiterView && "bg-amber-50 p-8 lg:p-12 rounded-[2rem] lg:rounded-[3rem] border border-amber-100 shadow-xl shadow-amber-900/5"
              )}>
                {isRecruiterView && (
                  <div className="flex items-center gap-3 mb-6 lg:mb-8">
                    <div className="px-4 py-1.5 bg-amber-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Recruiter Insight</div>
                    <div className="h-px flex-1 bg-amber-200" />
                  </div>
                )}
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
            </div>
          </section>

          <section className="mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">02 / Expertise</h2>
            </div>
            <div className="lg:col-span-8">
              <div className="flex flex-wrap gap-3 lg:gap-4">
                {content.skills.map((skill, i) => (
                  <span key={i} className={cn(
                    "px-6 lg:px-10 py-3 lg:py-5 rounded-2xl lg:rounded-3xl text-lg lg:text-xl font-bold transition-all duration-500",
                    isRecruiterView 
                      ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-200 scale-105" 
                      : "bg-neutral-50 text-neutral-800 border border-neutral-100 hover:border-neutral-300"
                  )}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">03 / Experience</h2>
            </div>
            <div className="lg:col-span-8 space-y-20 lg:space-y-32">
              {content.experience.map((exp, i) => (
                <div key={i} className="group">
                  <div className="flex flex-wrap justify-between items-baseline gap-4 mb-6 lg:mb-8">
                    <h3 className="text-3xl lg:text-5xl font-bold tracking-tighter">{exp.company}</h3>
                    <span className="text-neutral-300 font-mono text-xs lg:text-sm font-bold">{exp.duration}</span>
                  </div>
                  <p className="text-indigo-600 text-xl lg:text-2xl font-bold mb-6 lg:mb-10 tracking-tight">{exp.role}</p>
                  <ul className="space-y-4 lg:space-y-6 text-lg lg:text-xl text-neutral-500 leading-relaxed max-w-3xl">
                    {exp.description.map((bullet, j) => (
                      <li key={j} className="flex gap-4 lg:gap-5">
                        <span className="text-neutral-200 mt-2.5 w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-current shrink-0" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">04 / Projects</h2>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
              {content.projects.map((project, i) => (
                <div key={i} className="group p-8 lg:p-12 bg-neutral-50 rounded-[2rem] lg:rounded-[3rem] hover:bg-white hover:shadow-2xl hover:shadow-neutral-200 transition-all duration-700 border border-transparent hover:border-neutral-100">
                  <h3 className="text-2xl lg:text-3xl font-bold mb-4 lg:mb-6 tracking-tight">{project.title}</h3>
                  <p className="text-neutral-500 mb-8 lg:mb-10 leading-relaxed font-medium text-base lg:text-lg">{project.description}</p>
                  <div className="flex flex-wrap gap-2 lg:gap-3 mb-8 lg:mb-12">
                    {project.tech.map((t, j) => (
                      <span key={j} className="text-[9px] font-black uppercase tracking-widest text-neutral-400 bg-white px-3 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl border border-neutral-100">{t}</span>
                    ))}
                  </div>
                  {project.github && (
                    <a href={project.github} className="inline-flex items-center gap-3 lg:gap-4 text-xs lg:text-sm font-black text-neutral-900 group-hover:text-indigo-600 transition-colors">
                      View Case Study <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mb-40 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">05 / Education</h2>
            </div>
            <div className="lg:col-span-8 space-y-16">
              {content.education.map((edu, i) => (
                <div key={i} className="group">
                  <div className="flex flex-wrap justify-between items-baseline gap-4 mb-3">
                    <h3 className="text-3xl font-bold tracking-tight">{edu.school}</h3>
                    <span className="text-neutral-300 font-mono text-sm font-bold">{edu.year}</span>
                  </div>
                  <p className="text-neutral-500 text-xl italic">{edu.degree}</p>
                </div>
              ))}
            </div>
          </section>

          <footer className="pt-32 border-t border-neutral-100 flex flex-wrap justify-between items-center gap-12">
            <p className="text-neutral-400 font-bold text-sm uppercase tracking-widest">© {new Date().getFullYear()} {content.hero.name}</p>
            <div className="flex items-center gap-3 text-neutral-300 text-xs font-bold uppercase tracking-widest">
              Built with <Sparkles className="w-4 h-4 text-indigo-400" /> AI Studio
            </div>
          </footer>
        </div>
      </div>
    );
  }

  if (template === 'developer') {
    return (
      <div className="font-mono bg-[#050505] text-slate-400 min-h-screen selection:bg-indigo-500/30 selection:text-white">
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-24 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <aside className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 lg:mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Available for hire
              </div>
              <h1 className="text-4xl sm:text-6xl lg:text-8xl font-black text-white mb-6 lg:mb-8 tracking-tighter leading-none">
                <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
              </h1>
              <h2 className="text-xl lg:text-3xl text-indigo-400 mb-8 lg:mb-12 font-bold tracking-tight">
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </h2>
              <div className="text-slate-500 leading-relaxed mb-12 lg:mb-16 text-lg lg:text-xl max-w-md">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>

              <div className="mb-12 lg:mb-20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mb-6 lg:mb-8">Core Stack</h3>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {content.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white/5 text-indigo-400 text-[10px] lg:text-[11px] font-bold rounded-lg lg:rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <nav className="space-y-6 lg:space-y-8 mb-16 lg:mb-24 hidden lg:block">
                {['Experience', 'Projects', 'Education'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="flex items-center gap-6 lg:gap-8 group text-slate-600 hover:text-white transition-all">
                    <div className="h-px w-8 lg:w-12 bg-slate-800 group-hover:w-16 lg:group-hover:w-24 group-hover:bg-indigo-500 transition-all duration-500" />
                    <span className="text-[10px] lg:text-xs font-black uppercase tracking-[0.4em]">{item}</span>
                  </a>
                ))}
              </nav>

              <div className="flex gap-8 lg:gap-10">
                {content.contact.github && <a href={content.contact.github} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Github className="w-6 h-6 lg:w-8 lg:h-8" /></a>}
                {content.contact.linkedin && <a href={content.contact.linkedin} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Linkedin className="w-6 h-6 lg:w-8 lg:h-8" /></a>}
                <a href={`mailto:${content.contact.email}`} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Mail className="w-6 h-6 lg:w-8 lg:h-8" /></a>
              </div>
            </motion.div>
          </aside>

          <main className="lg:col-span-7 space-y-32 lg:space-y-48">
            <section id="experience" className="space-y-12 lg:space-y-20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-12 lg:mb-16">01 / Experience</h3>
              {content.experience.map((exp, i) => (
                <div key={i} className="group relative grid grid-cols-1 sm:grid-cols-4 gap-6 lg:gap-8 hover:bg-white/[0.03] p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] transition-all duration-700 border border-transparent hover:border-white/5">
                  <div className="sm:col-span-1 text-[10px] lg:text-[11px] font-black text-slate-700 uppercase tracking-widest pt-1 lg:pt-2">
                    {exp.duration}
                  </div>
                  <div className="sm:col-span-3">
                    <h3 className="text-white font-black text-xl lg:text-2xl mb-1 lg:mb-2 group-hover:text-indigo-400 transition-colors">{exp.role}</h3>
                    <p className="text-slate-500 font-bold text-base lg:text-lg mb-6 lg:mb-8">{exp.company}</p>
                    <ul className="space-y-3 lg:space-y-4 text-sm lg:text-base text-slate-500 leading-relaxed">
                      {exp.description.map((bullet, j) => (
                        <li key={j} className="flex gap-3 lg:gap-4">
                          <span className="text-indigo-500/40 mt-1.5 lg:mt-2">»</span>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </section>

            <section id="projects" className="space-y-10 lg:space-y-12">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-12 lg:mb-16">02 / Projects</h3>
              {content.projects.map((project, i) => (
                <div key={i} className="group p-8 lg:p-12 rounded-2xl lg:rounded-[3rem] border border-white/5 hover:border-indigo-500/40 hover:bg-indigo-500/[0.03] transition-all duration-700">
                  <div className="flex justify-between items-start mb-6 lg:mb-8">
                    <h3 className="text-white font-black text-2xl lg:text-3xl tracking-tight group-hover:text-indigo-400 transition-colors">
                      {project.title}
                    </h3>
                    {project.github && <ExternalLink className="w-5 h-5 lg:w-6 lg:h-6 text-slate-800 group-hover:text-indigo-400 transition-all" />}
                  </div>
                  <p className="text-slate-500 text-base lg:text-lg mb-8 lg:mb-12 leading-relaxed">{project.description}</p>
                  <div className="flex flex-wrap gap-2 lg:gap-3">
                    {project.tech.map((t, j) => (
                      <span key={j} className="px-3 py-1.5 lg:px-5 lg:py-2 bg-white/5 text-slate-400 text-[10px] lg:text-[11px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl border border-white/5">{t}</span>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            <section id="education" className="space-y-16">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-16">03 / Education</h3>
              {content.education.map((edu, i) => (
                <div key={i} className="border-l-4 border-white/5 pl-10 py-4 hover:border-indigo-500/50 transition-colors group">
                  <h4 className="text-white font-black text-2xl mb-2 group-hover:text-indigo-400 transition-colors">{edu.school}</h4>
                  <p className="text-indigo-400 text-lg mb-3 font-bold">{edu.degree}</p>
                  <p className="text-slate-700 text-sm font-black tracking-widest">{edu.year}</p>
                </div>
              ))}
            </section>

            <footer className="pt-24 border-t border-white/5">
              <p className="text-[11px] font-black uppercase tracking-[0.4em] text-slate-800">System.out.println("Goodbye World");</p>
            </footer>
          </main>
        </div>
      </div>
    );
  }

  if (template === 'modern') {
    return (
      <div className="font-sans bg-[#f8f9ff] text-neutral-900 min-h-screen selection:bg-indigo-600 selection:text-white">
        <div className="max-w-7xl mx-auto p-10 lg:p-24">
          <header className="mb-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <h1 className="text-5xl sm:text-7xl lg:text-[9rem] font-bold tracking-tighter leading-[0.85] mb-8 lg:mb-12">
                <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
              </h1>
              <p className="text-xl sm:text-3xl lg:text-5xl text-neutral-500 font-medium tracking-tight leading-tight">
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </p>
            </motion.div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* About & Skills - Bento Style */}
            <div className="lg:col-span-8 bg-white rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-indigo-500/5 border border-neutral-100">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8 lg:mb-10">About</h2>
              <div className="text-xl sm:text-2xl lg:text-4xl leading-snug font-medium tracking-tight text-neutral-800 mb-12 lg:mb-16">
                <EditableText multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {content.skills.map((skill, i) => (
                  <span key={i} className="px-4 lg:px-6 py-2 lg:py-3 bg-neutral-50 text-neutral-900 text-xs lg:text-sm font-bold rounded-xl lg:rounded-2xl border border-neutral-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact - Bento Style */}
            <div className="lg:col-span-4 bg-indigo-600 rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-12 text-white shadow-2xl shadow-indigo-500/20 flex flex-col justify-between">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-8 lg:mb-10">Connect</h2>
              <div className="space-y-6 lg:space-y-8">
                <a href={`mailto:${content.contact.email}`} className="block group">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">Email</p>
                  <p className="text-lg sm:text-2xl font-bold group-hover:translate-x-2 transition-transform flex items-center gap-3">
                    {content.contact.email} <ArrowRight className="w-5 h-5" />
                  </p>
                </a>
                {content.contact.linkedin && (
                  <a href={content.contact.linkedin} className="block group">
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-2">LinkedIn</p>
                    <p className="text-lg sm:text-2xl font-bold group-hover:translate-x-2 transition-transform flex items-center gap-3">
                      View Profile <ArrowRight className="w-5 h-5" />
                    </p>
                  </a>
                )}
              </div>
            </div>

            {/* Projects - Bento Style */}
            {content.projects.map((project, i) => (
              <div key={i} className={cn(
                "rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-12 shadow-2xl shadow-neutral-500/5 border border-neutral-100 group transition-all duration-700",
                i % 3 === 0 ? "lg:col-span-8 bg-white" : "lg:col-span-4 bg-white"
              )}>
                <div className="flex justify-between items-start mb-6 lg:mb-8">
                  <h3 className="text-2xl lg:text-3xl font-bold tracking-tight group-hover:text-indigo-600 transition-colors">{project.title}</h3>
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-2xl bg-neutral-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ExternalLink className="w-4 h-4 lg:w-5 lg:h-5" />
                  </div>
                </div>
                <p className="text-neutral-500 text-base lg:text-lg mb-8 lg:mb-12 leading-relaxed font-medium">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t, j) => (
                    <span key={j} className="px-3 lg:px-4 py-1.5 lg:py-2 bg-neutral-50 text-neutral-400 text-[9px] lg:text-[10px] font-black uppercase tracking-widest rounded-lg lg:rounded-xl border border-neutral-100">{t}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Experience - Bento Style */}
            <div className="lg:col-span-12 bg-white rounded-[2rem] lg:rounded-[3rem] p-8 lg:p-20 shadow-2xl shadow-indigo-500/5 border border-neutral-100">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-12 lg:mb-16">Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 lg:gap-16">
                {content.experience.map((exp, i) => (
                  <div key={i} className="space-y-4 lg:space-y-6">
                    <div className="flex justify-between items-baseline gap-4">
                      <h3 className="text-xl lg:text-2xl font-bold tracking-tight">{exp.company}</h3>
                      <span className="text-neutral-300 font-mono text-[10px] lg:text-xs font-bold">{exp.duration}</span>
                    </div>
                    <p className="text-indigo-600 font-bold text-base lg:text-lg">{exp.role}</p>
                    <ul className="space-y-2 lg:space-y-3 text-sm lg:text-base text-neutral-500 leading-relaxed font-medium">
                      {exp.description.slice(0, 2).map((bullet, j) => (
                        <li key={j} className="flex gap-3">
                          <span className="text-indigo-200 mt-2 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <footer className="mt-24 pt-12 border-t border-neutral-100 flex justify-between items-center">
            <p className="text-xs font-black uppercase tracking-[0.4em] text-neutral-300">© {new Date().getFullYear()} {content.hero.name}</p>
            <div className="flex items-center gap-3 text-neutral-300 text-xs font-bold uppercase tracking-widest">
              Built with <Sparkles className="w-4 h-4 text-indigo-400" /> AI Studio
            </div>
          </footer>
        </div>
      </div>
    );
  }

  // Professional Template
  return (
    <div className="font-serif bg-[#fdfdfb] text-neutral-900 min-h-full selection:bg-neutral-900 selection:text-white">
      <div className="max-w-6xl mx-auto px-10 lg:px-24 py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24 border-b-2 border-neutral-900 pb-16 lg:pb-24 mb-16 lg:mb-24">
          <div className="lg:col-span-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl sm:text-7xl lg:text-[10rem] font-black mb-8 lg:mb-12 leading-[0.85] tracking-tighter"
            >
              <EditableText value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </motion.h1>
            <p className="text-xl sm:text-3xl lg:text-4xl text-neutral-400 italic font-light tracking-tight">
              <EditableText value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
            </p>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end space-y-4 lg:space-y-6 text-left lg:text-right">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">Contact</p>
              <p className="text-lg lg:text-xl font-bold">{content.contact.email}</p>
            </div>
            {content.contact.linkedin && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">LinkedIn</p>
                <p className="text-lg lg:text-xl font-bold truncate">{content.contact.linkedin.replace('https://', '')}</p>
              </div>
            )}
            {content.contact.github && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">GitHub</p>
                <p className="text-lg lg:text-xl font-bold truncate">{content.contact.github.replace('https://', '')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          <div className="lg:col-span-4 space-y-16 lg:space-y-20">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-8 lg:mb-10">Expertise</h2>
              <div className="space-y-4 lg:space-y-6">
                {content.skills.map((skill, i) => (
                  <div key={i} className="text-xl lg:text-2xl font-bold border-b-2 border-neutral-100 pb-3 lg:pb-4 hover:border-neutral-900 transition-colors cursor-default">
                    {skill}
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-8 lg:mb-10">Education</h2>
              <div className="space-y-8 lg:space-y-10">
                {content.education.map((edu, i) => (
                  <div key={i} className="group">
                    <p className="text-xl lg:text-2xl font-black mb-1">{edu.school}</p>
                    <p className="text-base lg:text-lg text-neutral-500 italic mb-2">{edu.degree}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-neutral-300">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-24 lg:space-y-32">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-8 lg:mb-12">Professional Narrative</h2>
              <div className="text-xl sm:text-2xl lg:text-4xl leading-[1.3] font-light text-neutral-800 tracking-tight">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-12 lg:mb-16">Selected Experience</h2>
              <div className="space-y-16 lg:space-y-24">
                {content.experience.map((exp, i) => (
                  <div key={i} className="relative">
                    <div className="flex flex-wrap justify-between items-baseline gap-4 lg:gap-6 mb-6 lg:mb-8">
                      <h3 className="text-3xl lg:text-5xl font-black tracking-tighter">{exp.company}</h3>
                      <span className="text-neutral-300 italic text-lg lg:text-xl">{exp.duration}</span>
                    </div>
                    <p className="text-xl lg:text-2xl text-neutral-400 italic mb-8 lg:mb-10">{exp.role}</p>
                    <ul className="space-y-4 lg:space-y-6 text-lg lg:text-xl leading-relaxed text-neutral-600 max-w-2xl">
                      {exp.description.map((bullet, j) => (
                        <li key={j} className="relative pl-8 lg:pl-10">
                          <span className="absolute left-0 top-3 lg:top-4 w-3 lg:w-4 h-[2px] bg-neutral-200" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>

        <footer className="mt-40 pt-12 border-t-2 border-neutral-900 flex justify-between items-center">
          <p className="text-xs font-black uppercase tracking-[0.4em]">Anno Domini {new Date().getFullYear()}</p>
          <p className="text-xs font-black uppercase tracking-[0.4em]">{content.hero.name}</p>
        </footer>
      </div>
    </div>
  );
}
