import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
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
  ChevronLeft,
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
  Minus,
  Undo2,
  Redo2,
  Palette,
  LayoutList,
  GripVertical,
  MousePointer2,
  Lock,
  Share2,
  Scaling,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Type,
  Baseline,
  Highlighter,
  List,
  ListOrdered,
  ArrowUpDown
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
  const [previewScale, setPreviewScale] = useState(1);
  const [baseFontSize, setBaseFontSize] = useState(16);
  const [autoFit, setAutoFit] = useState(true);
  const [globalFontFamily, setGlobalFontFamily] = useState('Inter');
  const [githubUsername, setGithubUsername] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deployedUrl, setDeployedUrl] = useState<string | null>(null);
  const [isRecruiterView, setIsRecruiterView] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'content' | 'export'>('design');
  const [activeSidebarTab, setActiveSidebarTab] = useState<'templates' | 'theme' | 'sections' | 'ai'>('templates');
  const [rightPanelTab, setRightPanelTab] = useState<'edit' | 'settings'>('edit');
  const [undoStack, setUndoStack] = useState<PortfolioContent[]>([]);
  const [redoStack, setRedoStack] = useState<PortfolioContent[]>([]);
  const [isImproving, setIsImproving] = useState(false);

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  React.useEffect(() => {
    if (autoFit) {
      if (previewScale < 0.6) setBaseFontSize(24);
      else if (previewScale < 0.8) setBaseFontSize(20);
      else if (previewScale < 1) setBaseFontSize(18);
      else setBaseFontSize(16);
    }
  }, [autoFit, previewScale]);

  const handleAIImprove = async () => {
    if (!selectedElement || !portfolio) return;
    
    setIsImproving(true);
    try {
      const currentValue = selectedElement.path.split('.').reduce((obj: any, key) => obj?.[key], portfolio);
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Improve and professionalize the following ${selectedElement.label} for a portfolio website. Keep it concise but impactful. Return ONLY the improved text, nothing else.\n\nCurrent Text: ${currentValue}`,
      });

      const improvedText = response.text?.trim();
      if (improvedText) {
        const newPort = { ...portfolio };
        const keys = selectedElement.path.split('.');
        let current = newPort as any;
        for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
        current[keys[keys.length - 1]] = improvedText;
        handleContentUpdate(newPort);
      }
    } catch (err) {
      console.error('AI Improvement error:', err);
    } finally {
      setIsImproving(false);
    }
  };

  // Simple Undo/Redo logic
  const handleContentUpdate = (updated: PortfolioContent) => {
    if (portfolio) {
      setUndoStack(prev => [...prev, portfolio]);
      setRedoStack([]);
      setPortfolio(updated);
    }
  };

  const handleUndo = () => {
    if (undoStack.length > 0 && portfolio) {
      const prev = undoStack[undoStack.length - 1];
      setRedoStack(r => [...r, portfolio]);
      setUndoStack(u => u.slice(0, -1));
      setPortfolio(prev);
    }
  };

  const handleRedo = () => {
    if (redoStack.length > 0 && portfolio) {
      const next = redoStack[redoStack.length - 1];
      setUndoStack(u => [...u, portfolio]);
      setRedoStack(r => r.slice(0, -1));
      setPortfolio(next);
    }
  };
  const [isDeploying, setIsDeploying] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [showSourceCode, setShowSourceCode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [themeColor, setThemeColor] = useState('#4f46e5');
  const [accentColor, setAccentColor] = useState('#f59e0b');
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [selectedElement, setSelectedElement] = useState<{ path: string, label: string } | null>(null);
  const [showExportOptions, setShowExportOptions] = useState(false);
  const [loadingSteps, setLoadingSteps] = useState<{ id: number; label: string; status: 'pending' | 'loading' | 'complete' }[]>([]);

  const generateStaticHTML = () => {
    if (!portfolio) return '';

    const templateStyles = {
      minimal: `
        :root { --text: #171717; --muted: #a3a3a3; --bg: #fdfdfb; --accent: ${themeColor}; }
        body { font-family: '${globalFontFamily}', serif; background: var(--bg); color: var(--text); margin: 0; line-height: 1.6; }
        .container { max-width: 1100px; margin: 0 auto; padding: 100px 40px; }
        header { border-bottom: 2px solid var(--text); padding-bottom: 60px; margin-bottom: 80px; display: grid; grid-template-columns: 2fr 1fr; gap: 40px; }
        h1 { font-size: clamp(4rem, 12vw, 10rem); font-weight: 900; margin: 0; letter-spacing: -0.05em; line-height: 0.85; }
        .headline { font-size: 2.5rem; color: var(--muted); font-style: italic; margin-top: 40px; }
        .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; }
        section { margin-bottom: 80px; }
        h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.4em; margin-bottom: 40px; font-weight: 900; color: var(--accent); }
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
        :root { --primary: ${themeColor}; --bg: #050505; --text: #ffffff; }
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
        :root { --text: #171717; --muted: #737373; --bg: #ffffff; --accent: ${themeColor}; }
        body { font-family: '${globalFontFamily}', sans-serif; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1000px; margin: 0 auto; padding: 80px 40px; }
        header { border-bottom: 2px solid var(--text); padding-bottom: 60px; margin-bottom: 80px; display: flex; justify-content: space-between; align-items: flex-end; }
        h1 { font-size: 5rem; font-weight: 900; margin: 0; letter-spacing: -0.05em; }
        .main-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 80px; }
        h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.4em; margin-bottom: 40px; font-weight: 900; color: var(--accent); }
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
        :root { --primary: ${themeColor}; --bg: #f8f9ff; --text: #171717; }
        body { font-family: '${globalFontFamily}', sans-serif; background: var(--bg); color: var(--text); margin: 0; }
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
      `,
      glass: `
        :root { --primary: ${themeColor}; --bg: #f0f2f5; --text: #1e293b; }
        body { 
          font-family: '${globalFontFamily}', sans-serif; 
          background: radial-gradient(circle at top left, ${themeColor}15, transparent),
                      radial-gradient(circle at bottom right, #4f46e510, transparent),
                      var(--bg);
          color: var(--text); 
          margin: 0;
          min-height: 100vh;
        }
        .container { max-width: 1000px; margin: 0 auto; padding: 60px 20px; }
        .glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 32px;
          padding: 40px;
          margin-bottom: 32px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
        }
        h1 { font-size: 4rem; font-weight: 800; margin: 0; background: linear-gradient(to right, ${themeColor}, #4f46e5); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .headline { font-size: 1.5rem; color: #64748b; margin: 16px 0 32px; }
        .section-title { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.2em; color: ${themeColor}; margin-bottom: 24px; }
        .skill-tag { padding: 8px 16px; background: rgba(255, 255, 255, 0.5); border: 1px solid rgba(255, 255, 255, 0.8); border-radius: 12px; margin: 4px; display: inline-block; font-size: 0.875rem; font-weight: 600; }
        .exp-item { border-left: 2px solid ${themeColor}40; padding-left: 24px; margin-bottom: 32px; }
        @media (max-width: 768px) { h1 { font-size: 2.5rem; } }
      `,
      cyber: `
        :root { --primary: ${themeColor}; --bg: #030303; --text: #ffffff; }
        body { font-family: 'JetBrains Mono', monospace; background: var(--bg); color: var(--text); margin: 0; }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px; }
        .glitch-text { font-size: 5rem; font-weight: 800; color: var(--primary); text-transform: uppercase; letter-spacing: -4px; position: relative; margin: 0; }
        .glitch-text::after { content: attr(data-text); position: absolute; left: 2px; text-shadow: -2px 0 #ff00ff; background: var(--bg); overflow: hidden; clip: rect(0,900px,0,0); animation: noise-2 3s infinite linear alternate-reverse; }
        @keyframes noise-2 { 0% { clip: rect(40px,940px,50px,0); } 100% { clip: rect(20px,940px,80px,0); } }
        .cyber-panel { border: 1px solid var(--primary); position: relative; padding: 32px; background: rgba(255,255,255,0.02); margin-bottom: 24px; clip-path: polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%); }
        .cyber-panel::before { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(45deg, transparent 95%, var(--primary) 95%); }
        .label { font-size: 0.65rem; color: var(--primary); text-transform: uppercase; letter-spacing: 0.3em; margin-bottom: 16px; display: block; opacity: 0.7; }
        .skill-tag { border: 1px solid var(--primary); color: var(--primary); padding: 4px 12px; margin: 4px; display: inline-block; font-size: 0.75rem; text-transform: uppercase; }
        @media (max-width: 768px) { .glitch-text { font-size: 2.5rem; letter-spacing: -2px; } }
      `
    };

    const getTemplateHTML = () => {
      if (template === 'cyber') {
        return `
          <div class="container">
            <header style="margin-bottom: 80px">
              <span class="label">System Identity / Active</span>
              <h1 class="glitch-text" data-text="${portfolio.hero.name}">${portfolio.hero.name}</h1>
              <p class="headline" style="color: var(--primary); opacity: 0.8">${portfolio.hero.headline}</p>
            </header>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px">
              <div class="cyber-panel">
                <span class="label">Core Bio</span>
                <p style="line-height: 1.8; opacity: 0.9">${portfolio.about}</p>
              </div>
              
              <div class="cyber-panel">
                <span class="label">Neural Stack / Skills</span>
                <div style="display: flex; flex-wrap: wrap; gap: 8px">
                  ${portfolio.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
              </div>
            </div>

            <div class="cyber-panel" style="margin-top: 40px">
              <span class="label">Operational History</span>
              ${portfolio.experience.map(exp => `
                <div style="margin-bottom: 32px; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 24px">
                  <h3 style="color: var(--primary); margin: 0 0 8px 0">${exp.company}</h3>
                  <p style="font-weight: bold; margin: 0 0 16px 0">${exp.role} / ${exp.duration}</p>
                  <ul style="opacity: 0.7; font-size: 0.9rem">${exp.description.map(d => `<li>${d}</li>`).join('')}</ul>
                </div>
              `).join('')}
            </div>

            <div style="margin-top: 40px; display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px">
               ${portfolio.projects.map(p => `
                <div class="cyber-panel">
                  <span class="label">Artifact / ${p.tech[0] || 'Project'}</span>
                  <h3 style="margin: 16px 0">${p.title}</h3>
                  <p style="font-size: 0.8rem; opacity: 0.6; margin-bottom: 24px">${p.description}</p>
                  <div style="display: flex; gap: 8px">
                    ${p.tech.map(t => `<span style="font-size: 10px; color: var(--primary)">[${t}]</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

      if (template === 'glass') {
        return `
          <div class="container">
            <div class="glass-card" style="text-align: center">
              <h1>${portfolio.hero.name}</h1>
              <p class="headline">${portfolio.hero.headline}</p>
              <div style="display: flex; justify-content: center; gap: 16px">
                ${portfolio.contact.linkedin ? `<a href="${portfolio.contact.linkedin}" style="color: var(--primary); font-weight: bold; text-decoration: none">LinkedIn</a>` : ''}
                ${portfolio.contact.github ? `<a href="${portfolio.contact.github}" style="color: var(--primary); font-weight: bold; text-decoration: none">GitHub</a>` : ''}
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 32px">
              <div class="glass-card">
                <span class="section-title">The Story</span>
                <p style="font-size: 1.1rem; line-height: 1.8; color: #475569">${portfolio.about}</p>
              </div>
              <div class="glass-card">
                <span class="section-title">Expertise</span>
                <div style="display: flex; flex-wrap: wrap; gap: 8px">
                  ${portfolio.skills.map(s => `<span class="skill-tag">${s}</span>`).join('')}
                </div>
              </div>
            </div>

            <div class="glass-card">
              <span class="section-title">Experience</span>
              ${portfolio.experience.map(exp => `
                <div class="exp-item">
                  <h3 style="margin: 0; font-size: 1.5rem">${exp.company}</h3>
                  <p style="color: var(--primary); font-weight: 700; margin: 4px 0 16px">${exp.role} · ${exp.duration}</p>
                  <ul style="color: #64748b; font-size: 0.95rem">${exp.description.map(d => `<li style="margin-bottom: 8px">${d}</li>`).join('')}</ul>
                </div>
              `).join('')}
            </div>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 32px">
              ${portfolio.projects.map(p => `
                <div class="glass-card" style="margin-bottom: 0">
                  <h3 style="margin: 0 0 12px 0">${p.title}</h3>
                  <p style="font-size: 0.9rem; color: #64748b; margin-bottom: 20px">${p.description}</p>
                  <div style="display: flex; flex-wrap: wrap; gap: 6px">
                    ${p.tech.map(t => `<span style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: var(--primary)">${t}</span>`).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      }

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
              <div class="card span-4" style="background: var(--primary); color: white">
                <span class="label" style="color: white; opacity: 0.7">Connect</span>
                <p style="font-size: 1.5rem; font-weight: bold">${portfolio.contact.email}</p>
                <p style="margin-top: 20px">Let's build something amazing together.</p>
              </div>
              ${portfolio.projects.map((p, i) => `
                <div class="card ${i % 3 === 0 ? 'span-8' : 'span-4'}">
                  <span class="label">Project</span>
                  <h3 style="font-size: 2rem; margin: 0 0 16px 0">${p.title}</h3>
                  <p style="color: #6b7280">${p.description}</p>
                  <div style="margin-top: 24px">${p.tech.map(t => `<span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: var(--primary); margin-right: 12px">${t}</span>`).join('')}</div>
                </div>
              `).join('')}
              <div class="card span-12">
                <span class="label">Experience</span>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px">
                  ${portfolio.experience.map(exp => `
                    <div>
                      <h3 style="font-size: 1.5rem; margin: 0 0 8px 0">${exp.company}</h3>
                      <p style="color: var(--primary); font-weight: bold; margin-bottom: 16px">${exp.role}</p>
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
            <p style="font-size: 2.5rem; font-weight: 500">${portfolio.about}</p>
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
                    <h3 style="font-size: 3rem; margin: 0">${exp.company}</h3>
                    <span style="color: var(--muted); font-family: monospace">${exp.duration}</span>
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
                  <div style="margin-top: 24px">${p.tech.map(t => `<span style="font-size: 0.75rem; font-weight: 900; text-transform: uppercase; color: var(--muted); margin-right: 12px">${t}</span>`).join('')}</div>
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
    if (file) {
      setResumeFile(file);
      e.target.value = ''; // Reset to allow re-uploading same file if needed
    }
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
      
      // Trigger Congrats Modal
      window.dispatchEvent(new CustomEvent('feature-success', { detail: { feature: 'portfolio' } }));
      
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

  const [isLargeScreen, setIsLargeScreen] = useState(true);

  React.useEffect(() => {
    const checkScreen = () => setIsLargeScreen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  if (!isLargeScreen) {
    return (
      <div className="min-h-[500px] bg-slate-950 flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border border-slate-800">
        <div className="w-20 h-20 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center mb-8 border border-indigo-500/20">
          <Smartphone className="w-10 h-10 text-indigo-400" />
        </div>
        <h2 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">Desktop Studio</h2>
        <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8 max-w-sm mx-auto">
          The Portfolio Editor requires the precision of a desktop workspace.
        </p>
        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-indigo-400 text-sm font-bold uppercase tracking-widest animate-pulse">
          <Sparkles className="w-4 h-4" />
          Coming Soon for Mobile & Tablet
        </div>
      </div>
    );
  }

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
                    
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const file = e.dataTransfer.files?.[0];
                        if (file) setResumeFile(file);
                      }}
                      className={cn(
                        "relative border-2 border-dashed rounded-[1.5rem] md:rounded-[2rem] p-8 md:p-20 text-center cursor-pointer transition-all duration-500 overflow-hidden group/drop",
                        resumeFile 
                          ? "border-green-500/30 bg-green-500/5" 
                          : "border-[var(--border-color)] bg-[var(--bg-secondary)] hover:border-indigo-500/30 hover:bg-indigo-500/5 shadow-inner"
                      )}
                    >
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
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="px-6 md:px-8 py-2.5 md:py-3 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-xl md:rounded-2xl text-[13px] md:text-sm font-bold hover:bg-[var(--bg-secondary)] transition-all shadow-sm active:scale-95"
                            >
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

        {/* Studio Workspace */}
        {portfolio && !isGenerating && (
          <>
            {/* Mobile/Tablet Placeholder */}
            <div className="lg:hidden fixed inset-0 top-16 z-[200] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl flex items-center justify-center mb-8 animate-bounce">
                <Monitor className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-4">Coming Soon for Mobile & Tablet</h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">
                The full Studio experience is optimized for desktop. Please switch to a larger screen to build your masterpiece.
              </p>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:flex fixed inset-0 top-16 md:top-20 z-[200] bg-[#f2f3f5] dark:bg-slate-950 overflow-hidden flex-col font-sans">
            {/* Studio Toolbar */}
            <header className="h-14 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-30 shadow-sm shrink-0">
              <div className="flex items-center gap-4">
                <button onClick={() => setPortfolio(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-all flex items-center gap-2 group">
                  <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Dashboard</span>
                </button>
                <div className="h-4 w-px bg-slate-200 dark:bg-slate-800" />
                <div className="flex items-center gap-1">
                  <button onClick={handleUndo} disabled={undoStack.length === 0} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-30"><Undo2 className="w-4 h-4" /></button>
                  <button onClick={handleRedo} disabled={redoStack.length === 0} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 disabled:opacity-30"><Redo2 className="w-4 h-4" /></button>
                </div>
              </div>

              {/* Right Side Controls */}
              <div className="flex items-center gap-3">
                <button onClick={() => setIsRecruiterView(!isRecruiterView)} className={cn("flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-sm", 
                    isRecruiterView ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400")}>
                  <Eye className="w-3.5 h-3.5" />Recruiter View
                </button>
                <button onClick={() => handleDeploy()} disabled={isDeploying} className="px-5 py-1.5 bg-slate-900 dark:bg-indigo-600 text-white rounded-full text-xs font-bold hover:bg-black dark:hover:bg-indigo-500 transition-all flex items-center justify-center shadow-lg shadow-black/10">
                  {isDeploying ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : <Rocket className="w-3.5 h-3.5 mr-2" />}Publish
                </button>
              </div>
            </header>

            <main className="flex-1 flex overflow-hidden">
              {/* Left Sidebar */}
              <aside className="w-64 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col z-20">
                <div className="flex border-b border-slate-100 dark:border-slate-800">
                  {[
                    { id: 'design', icon: LayoutList, label: 'Design' },
                    { id: 'pages', icon: Layers, label: 'Pages' }
                  ].map((tab) => (
                    <button key={tab.id} onClick={() => setActiveSidebarTab(tab.id as any)} className={cn("flex-1 p-4 flex flex-col items-center gap-1.5 relative transition-colors", activeSidebarTab === tab.id ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300")}>
                      <tab.icon className="w-5 h-5" /><span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
                      {activeSidebarTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400 rounded-full mx-6" />}
                    </button>
                  ))}
                </div>
                <div className="flex-1 overflow-y-auto p-5 scrollbar-hide">
                  {activeSidebarTab === 'design' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-[0.2em]">Templates</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {['minimal', 'developer', 'modern', 'professional', 'glass', 'cyber'].map((t) => (
                            <button 
                              key={t} 
                              onClick={() => setTemplate(t as PortfolioTemplate)} 
                              className={cn(
                                "p-3 rounded-xl border text-[10px] font-black capitalize transition-all", 
                                template === t 
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20" 
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-indigo-200"
                              )}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-[0.2em]">Typography</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {[
                            { name: 'Inter (Sans)', family: 'Inter' },
                            { name: 'Outfit (Modern)', family: 'Outfit' },
                            { name: 'Playfair (Serif)', family: 'Playfair' },
                            { name: 'Space Grotesk', family: 'Space Grotesk' },
                            { name: 'JetBrains (Mono)', family: 'Mono' }
                          ].map((f) => (
                            <button 
                              key={f.family} 
                              onClick={() => setGlobalFontFamily(f.family)} 
                              className={cn(
                                "w-full p-3 rounded-xl border text-left text-xs font-bold transition-all", 
                                globalFontFamily === f.family 
                                  ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400" 
                                  : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-indigo-100"
                              )}
                            >
                              {f.name}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-slate-100 dark:bg-slate-800" />

                      <div>
                        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 mb-4 uppercase tracking-[0.2em]">Accent Color</h3>
                        <div className="grid grid-cols-5 gap-2">
                          {['#4f46e5', '#ef4444', '#10b981', '#f59e0b', '#000000', '#ec4899', '#06b6d4', '#8b5cf6'].map((c) => (
                            <button 
                              key={c} 
                              onClick={() => setThemeColor(c)} 
                              className={cn(
                                "aspect-square rounded-full transition-all border-2", 
                                themeColor === c ? "border-indigo-500 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900" : "border-transparent hover:scale-110 shadow-sm"
                              )} 
                              style={{ backgroundColor: c }} 
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeSidebarTab === 'pages' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <h3 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest">Section Manager</h3>
                        <div className="space-y-2">
                          {['Hero', 'About', 'Experience', 'Projects', 'Contact'].map(section => (
                            <div key={section} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{section}</span>
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </aside>

              {/* Center Canvas */}
              <section className="flex-1 overflow-hidden bg-[#f8f9fb] dark:bg-slate-950 relative flex flex-col items-center p-4">
                <motion.div layout className="w-full h-full bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden relative transition-all duration-700 flex flex-col">
                  <div className="h-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center px-6 shrink-0 justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-red-400/30" />
                      <div className="w-2 h-2 rounded-full bg-amber-400/30" />
                      <div className="w-2 h-2 rounded-full bg-emerald-400/30" />
                    </div>
                    <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.2em] bg-slate-50 dark:bg-slate-800 px-4 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                      Live Responsive Workspace
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto relative editor-canvas scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800 scrollbar-track-transparent">
                    <div className="w-full min-h-full transition-all duration-500">
                      <PortfolioPreview 
                        content={portfolio} 
                        template={template} 
                        isEditing={isEditing || true} 
                        isRecruiterView={isRecruiterView}
                        selectedElement={selectedElement}
                        onSelectElement={(el) => setSelectedElement(el)}
                        onChange={(updated) => handleContentUpdate(updated)}
                        themeColor={themeColor}
                        baseFontSize={baseFontSize}
                        globalFontFamily={
                          globalFontFamily === 'Inter' ? '"Inter", sans-serif' : 
                          globalFontFamily === 'Playfair' ? '"Playfair Display", serif' : 
                          globalFontFamily === 'Outfit' ? '"Outfit", sans-serif' :
                          globalFontFamily === 'Space Grotesk' ? '"Space Grotesk", sans-serif' :
                          '"JetBrains Mono", monospace'
                        }
                      />
                    </div>
                  </div>
                </motion.div>
              </section>

              {/* Right Sidebar */}
              <aside className="w-80 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col z-20 shrink-0">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest">Inspector</h3>
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                </div>
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                  {selectedElement ? (
                    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                      <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Metadata</p>
                          <button onClick={() => setSelectedElement(null)} className="text-indigo-400 hover:text-indigo-600 transition-colors"><X className="w-3 h-3" /></button>
                        </div>
                        <p className="text-xs font-bold text-indigo-900 dark:text-indigo-300">{selectedElement.label}</p>
                      </div>
                      
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest px-1">Live Content</label>
                        <textarea 
                          className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 text-sm font-medium min-h-[200px] outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all shadow-sm text-slate-800 dark:text-slate-200 leading-relaxed" 
                          value={selectedElement.path.split('.').reduce((obj: any, key) => obj?.[key], portfolio)}
                          onChange={(e) => {
                            const newPort = { ...portfolio };
                            const keys = selectedElement.path.split('.');
                            let current = newPort as any;
                            for (let i = 0; i < keys.length - 1; i++) current = current[keys[i]];
                            current[keys[keys.length - 1]] = e.target.value;
                            handleContentUpdate(newPort);
                          }}
                        />
                      </div>

                      <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
                        <button 
                          onClick={handleAIImprove}
                          disabled={isImproving}
                          className="w-full py-4 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                          {isImproving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Sparkles className="w-3.5 h-3.5" />
                              AI Smart Improve
                            </>
                          )}
                        </button>
                        <p className="text-[10px] text-slate-400 text-center mt-4 font-medium italic">Changes are instantly applied across all devices.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-6 opacity-30 select-none">
                      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center">
                        <MousePointer2 className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 leading-tight">Layer Selected: None</p>
                        <p className="text-[10px] font-medium text-slate-500 mt-2 leading-relaxed">Click any text on the workspace to begin editing its properties.</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={handleDownloadPDF} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group">
                      <Printer className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" /><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">PDF Resume</span>
                    </button>
                    <button onClick={() => setShowSourceCode(true)} className="flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all group">
                      <Code className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400" /><span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Code</span>
                    </button>
                  </div>
                </div>
              </aside>
            </main>
          </div>
        </>
      )}

        {/* PDF Generation Loading Overlay */}
        <AnimatePresence>
          {loadingSteps.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl"
            >
              <div className="w-full max-w-md p-12 bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-4 mb-12">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center">
                    <Printer className="w-6 h-6 text-white animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Generating PDF</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Please stay on this page</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {loadingSteps.map((step) => (
                    <div key={step.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-colors duration-500",
                          step.status === 'complete' ? "bg-green-500" : step.status === 'loading' ? "bg-indigo-600" : "bg-slate-100 dark:bg-slate-800"
                        )}>
                          {step.status === 'complete' ? (
                            <Check className="w-3 h-3 text-white" />
                          ) : step.status === 'loading' ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                          ) : null}
                        </div>
                        <span className={cn(
                          "text-sm font-bold tracking-tight transition-colors duration-500",
                          step.status === 'complete' ? "text-slate-900 dark:text-slate-100" : step.status === 'loading' ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 dark:text-slate-500"
                        )}>
                          {step.label}
                        </span>
                      </div>
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
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSourceCode(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-xl"><Code className="w-5 h-5 text-white" /></div>
                    <h3 className="text-slate-900 font-bold">Portfolio Source Code</h3>
                  </div>
                  <button onClick={() => setShowSourceCode(false)} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
                </div>
                <div className="flex-1 overflow-auto p-8 bg-slate-50">
                  <pre className="text-indigo-600 bg-white p-8 rounded-3xl border border-slate-200 overflow-x-auto whitespace-pre-wrap font-mono text-xs">
                    {`// Managed JSON Portfolio Configuration\n\n${JSON.stringify(portfolio, null, 2)}`}
                  </pre>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
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
  onChange,
  themeColor,
  globalFontFamily,
  baseFontSize
}: { 
  content: PortfolioContent; 
  template: PortfolioTemplate; 
  isEditing: boolean;
  isRecruiterView: boolean;
  selectedElement: { path: string, label: string } | null;
  onSelectElement: (el: { path: string, label: string } | null) => void;
  onChange: (updated: PortfolioContent) => void;
  themeColor: string;
  globalFontFamily: string;
  baseFontSize: number;
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
    const styleOverride = content?.styles?.[path] || {};
    
    const computedStyles: React.CSSProperties = {
      fontSize: styleOverride.fontSize ? `${styleOverride.fontSize}px` : undefined,
      fontWeight: styleOverride.fontWeight || undefined,
      fontStyle: styleOverride.fontStyle || undefined,
      textDecoration: styleOverride.textDecoration || undefined,
      textAlign: styleOverride.textAlign || undefined,
      color: styleOverride.color || undefined,
      backgroundColor: styleOverride.backgroundColor || undefined,
      lineHeight: styleOverride.lineHeight || 1.4,
      fontFamily: styleOverride.fontFamily || undefined,
      wordBreak: 'break-word',
      maxWidth: '100%',
      display: 'inline-block',
      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const updateStyle = (key: string, val: any) => {
      const newContent = { ...content };
      if (!newContent.styles) newContent.styles = {};
      newContent.styles[path] = { ...newContent.styles[path], [key]: val };
      onChange(newContent);
    };

    const toggleStyle = (key: string, activeVal: any, defaultVal: any = undefined) => {
      const current = styleOverride[key];
      updateStyle(key, current === activeVal ? defaultVal : activeVal);
    };

    if (!isEditing) return <span className={cn(className, "inline-block max-w-full break-words")} style={computedStyles}>{value}</span>;
    
    return (
      <span 
        className={cn(
          "relative group/edit inline-block w-full transition-all cursor-text max-w-full",
          isSelected ? "ring-2 ring-indigo-500 ring-offset-8 rounded-lg" : "hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 rounded-lg"
        )}
        style={computedStyles}
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
              "w-full bg-transparent border-none focus:outline-none transition-all text-inherit resize-none py-1 block overflow-hidden break-words",
              className
            )}
            rows={Math.max(1, value.split('\n').length)}
            style={computedStyles}
          />
        ) : (
          <input 
            type="text" 
            value={value}
            onChange={(e) => onSave(e.target.value)}
            className={cn(
              "w-full bg-transparent border-none focus:outline-none transition-all text-inherit py-1 block truncate",
              className
            )}
            style={computedStyles}
          />
        )}

        {/* Simplified professional toolbar */}
        <div className={cn(
          "absolute -top-16 left-1/2 -translate-x-1/2 opacity-0 group-hover/edit:opacity-100 transition-all duration-300 pointer-events-auto z-[100] flex flex-col items-center gap-1 min-w-max",
          isSelected && "opacity-100 -top-20 scale-100",
          !isSelected && "scale-95"
        )}>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex items-center p-1.5 gap-1 backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/5">
            
            {/* Font & Size Group */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl">
              {/* Font Family Dropdown */}
              <div className="relative group/font">
                <button className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-indigo-400 transition-all min-w-[130px] justify-between h-9 shadow-sm">
                  <span className="text-[12px] font-semibold truncate text-slate-700 dark:text-slate-200">
                    {styleOverride.fontFamily?.split(',')[0]?.replace(/"/g, '') || 'Inter'}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <div className="absolute top-full left-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/font:opacity-100 group-hover/font:visible transition-all z-[110] p-1.5 ring-1 ring-black/5">
                  {['Inter', 'Outfit', 'Playfair Display', 'Space Grotesk', 'JetBrains Mono', 'Plus Jakarta Sans', 'Cabinet Grotesk', 'General Sans'].map(f => (
                    <button 
                      key={f} 
                      onClick={(e) => { e.stopPropagation(); updateStyle('fontFamily', f === 'Playfair Display' ? '"Playfair Display", serif' : `"${f}", sans-serif`); }}
                      className="w-full px-3 py-2 text-left text-[12px] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-slate-700 dark:text-slate-200 transition-colors font-medium"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size Control */}
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1 h-9 shadow-sm">
                <button 
                  onClick={(e) => { e.stopPropagation(); updateStyle('fontSize', Math.max(8, (styleOverride.fontSize || 16) - 2)); }} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <div className="relative group/size">
                  <button className="flex items-center gap-1 px-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors h-full">
                    <span className="text-[12px] font-bold text-slate-700 dark:text-slate-200 min-w-[20px] text-center">{styleOverride.fontSize || 16}</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover/size:opacity-100 group-hover/size:visible transition-all z-[110] p-1 max-h-48 overflow-y-auto">
                    {[10, 12, 14, 16, 18, 20, 24, 32, 40, 48, 64, 96, 128].map(s => (
                      <button 
                        key={s} 
                        onClick={(e) => { e.stopPropagation(); updateStyle('fontSize', s); }}
                        className="w-full text-center py-1 text-[11px] hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded text-slate-700 dark:text-slate-200 transition-colors"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); updateStyle('fontSize', (styleOverride.fontSize || 16) + 2); }} 
                  className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Style Formatting */}
            <div className="flex items-center gap-0.5">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStyle('fontWeight', 'bold', 'normal'); }}
                className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all", styleOverride.fontWeight === 'bold' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
              >
                <Bold className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStyle('fontStyle', 'italic', 'normal'); }}
                className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all", styleOverride.fontStyle === 'italic' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
              >
                <Italic className="w-4.5 h-4.5" />
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStyle('textDecoration', 'underline', 'none'); }}
                className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all", styleOverride.textDecoration === 'underline' ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
              >
                <Underline className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Colors */}
            <div className="flex items-center gap-0.5 px-1">
              <button 
                onClick={(e) => { e.stopPropagation(); toggleStyle('backgroundColor', '#fef08a', 'transparent'); }} 
                className={cn("w-9 h-9 flex flex-col items-center justify-center rounded-xl transition-all", styleOverride.backgroundColor === '#fef08a' ? "bg-yellow-100 dark:bg-yellow-900/40" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
              >
                <Highlighter className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                <div className="w-4 h-1 bg-yellow-400 rounded-full mt-0.5" />
              </button>
              <div className="relative group/color">
                <button 
                  className={cn("w-9 h-9 flex flex-col items-center justify-center rounded-xl transition-all", styleOverride.color ? "bg-slate-100 dark:bg-slate-800" : "hover:bg-slate-100 dark:hover:bg-slate-800")}
                >
                  <Baseline className="w-4 h-4" style={{ color: styleOverride.color || 'currentColor' }} />
                  <div className="w-4 h-1 rounded-full mt-0.5" style={{ backgroundColor: styleOverride.color || '#4f46e5' }} />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl opacity-0 invisible group-hover/color:opacity-100 group-hover/color:visible transition-all z-[110] grid grid-cols-5 gap-1.5 w-40 ring-1 ring-black/5">
                  {['#000000', '#ffffff', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#d946ef'].map(c => (
                    <button 
                      key={c} 
                      onClick={(e) => { e.stopPropagation(); updateStyle('color', c); }}
                      className="w-6 h-6 rounded-md border border-slate-200 dark:border-slate-700 transition-transform hover:scale-110 shadow-sm"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateStyle('color', 'inherit'); }}
                    className="col-span-5 text-[10px] py-1 bg-slate-50 dark:bg-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors font-bold uppercase tracking-wider"
                  >
                    Reset Color
                  </button>
                </div>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

            {/* Alignment */}
            <div className="flex items-center gap-0.5">
              {[
                { id: 'left', icon: AlignLeft },
                { id: 'center', icon: AlignCenter },
                { id: 'right', icon: AlignRight }
              ].map(align => (
                <button 
                  key={align.id}
                  onClick={(e) => { e.stopPropagation(); updateStyle('textAlign', align.id); }}
                  className={cn("w-9 h-9 flex items-center justify-center rounded-xl transition-all", styleOverride.textAlign === align.id ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400" : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400")}
                >
                  <align.icon className="w-4.5 h-4.5" />
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex flex-col items-center gap-1 group/label">
            <div className="w-px h-3 bg-indigo-500/40 group-hover/label:bg-indigo-500 transition-colors" />
            <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-full shadow-lg border border-indigo-500/50">
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">
                {label}
              </span>
              <div className="w-1 h-1 rounded-full bg-white/40" />
              <button 
                onClick={(e) => { e.stopPropagation(); onSelectElement(null); }}
                className="hover:scale-125 transition-transform"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </div>
          </div>
        </div>
      </span>
    );
  };

  const responsiveStyles = {
    fontSize: `${baseFontSize}px`,
    fontFamily: globalFontFamily
  };

  if (template === 'glass') {
    return (
      <div className="min-h-full bg-[#f0f2f5] p-6 md:p-10 lg:p-20 text-slate-800 transition-colors duration-500" style={{ 
        ...responsiveStyles,
        background: `radial-gradient(circle at top left, ${themeColor}15, transparent), radial-gradient(circle at bottom right, #4f46e510, transparent), #f0f2f5`
      }}>
        <div className="max-w-5xl mx-auto">
          <header className="mb-16 md:mb-24">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 tracking-tighter max-w-full break-words" style={{ background: `linear-gradient(to right, ${themeColor}, #4f46e5)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </h1>
            <div className="text-lg md:text-xl lg:text-3xl text-slate-500 mb-6 md:mb-8 font-medium max-w-full">
              <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-8">
            <div className="bg-white/70 backdrop-blur-2xl border border-white/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-black/5">
              <h2 className="text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6" style={{ color: themeColor }}>The Story</h2>
              <div className="text-base md:text-lg leading-relaxed text-slate-600 font-medium">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
            </div>
            <div className="bg-white/70 backdrop-blur-2xl border border-white/30 rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl shadow-black/5">
              <h2 className="text-[10px] font-black uppercase tracking-widest mb-4 md:mb-6" style={{ color: themeColor }}>Expertise</h2>
              <div className="flex flex-wrap gap-2">
                {content.skills.map((s, i) => (
                  <span key={i} className="px-4 md:px-5 py-2 md:py-3 bg-white/50 backdrop-blur-md border border-white/80 rounded-xl md:rounded-2xl text-xs md:text-sm font-bold shadow-sm">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white/70 backdrop-blur-2xl border border-white/30 rounded-[2rem] md:rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-2xl shadow-black/5">
            <h2 className="text-[10px] font-black uppercase tracking-widest mb-6 md:mb-10" style={{ color: themeColor }}>Experience</h2>
            <div className="space-y-8 md:space-y-12">
              {content.experience.map((exp, i) => (
                <div key={i} className="border-l-4 p-6 md:p-8 transition-all hover:bg-white/30 rounded-r-3xl" style={{ borderColor: `${themeColor}40` }}>
                  <h3 className="text-xl md:text-2xl lg:text-3xl font-black mb-2 tracking-tight">{exp.company}</h3>
                  <p className="text-base md:text-lg lg:text-xl font-bold mb-4 md:mb-6" style={{ color: themeColor }}>{exp.role} · {exp.duration}</p>
                  <ul className="space-y-3 md:space-y-4 text-sm md:text-base text-slate-500 font-medium">
                    {exp.description.map((d, j) => <li key={j} className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ backgroundColor: themeColor }} />
                      {d}
                    </li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.projects.map((p, i) => (
              <div key={i} className="bg-white/70 backdrop-blur-2xl border border-white/30 rounded-[2.5rem] p-10 shadow-2xl shadow-black/5 hover:scale-[1.02] transition-transform">
                <h3 className="text-2xl font-black mb-4 tracking-tight">{p.title}</h3>
                <p className="text-slate-500 mb-8 line-clamp-3 font-medium">{p.description}</p>
                <div className="flex flex-wrap gap-2">
                  {p.tech.map((t, j) => (
                    <span key={j} className="text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg bg-white/50 border border-white/80" style={{ color: themeColor }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'cyber') {
    return (
      <div className="min-h-full bg-black text-white p-6 md:p-12 lg:p-20 selection:bg-indigo-500/50" style={responsiveStyles}>
        <div className="max-w-7xl mx-auto">
          <header className="mb-16 md:mb-24">
            <h1 className="text-4xl md:text-7xl lg:text-9xl font-black uppercase tracking-tighter relative group break-words leading-none max-w-full" style={{ color: themeColor }}>
              <div className="absolute -inset-1 bg-white/5 blur-3xl rounded-full group-hover:bg-indigo-500/10 transition-colors" />
              <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </h1>
            <div className="text-lg md:text-2xl lg:text-4xl font-bold opacity-80 mt-4 md:mt-6 max-w-full" style={{ color: themeColor }}>
              <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-8">
             <div className="lg:col-span-12 border border-indigo-500/30 p-1 bg-white/[0.02]">
                <div className="border border-indigo-500/50 p-6 md:p-10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl" />
                  <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 md:mb-6 flex items-center gap-2" style={{ color: themeColor }}>
                    <div className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    Neural Biography
                  </h2>
                  <div className="text-lg md:text-2xl lg:text-3xl leading-relaxed font-bold max-w-4xl">
                    <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
                  </div>
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 mb-8">
            <div className="lg:col-span-8 border border-white/5 p-6 md:p-10 bg-white/[0.02]">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 md:mb-12 flex items-center gap-2" style={{ color: themeColor }}>Experience Sequence</h2>
               <div className="space-y-12 md:space-y-16">
                 {content.experience.map((exp, i) => (
                   <div key={i} className="group relative">
                      <div className="flex flex-wrap justify-between items-baseline gap-2 mb-4">
                        <h3 className="text-2xl md:text-3xl font-black uppercase group-hover:text-indigo-400 transition-colors">{exp.company}</h3>
                        <span className="text-[10px] font-bold opacity-40">{exp.duration}</span>
                      </div>
                      <p className="text-lg md:text-xl font-bold mb-6 md:mb-8" style={{ color: themeColor }}>{exp.role}</p>
                      <ul className="space-y-3 md:space-y-4 opacity-50 text-xs md:text-sm font-bold">
                        {exp.description.map((d, j) => <li key={j}>/ {d}</li>)}
                      </ul>
                   </div>
                 ))}
               </div>
            </div>
            <div className="lg:col-span-4 border border-white/5 p-6 md:p-10 bg-white/[0.02]">
               <h2 className="text-[10px] font-black uppercase tracking-[0.4em] mb-8 md:mb-12 flex items-center gap-2" style={{ color: themeColor }}>Core Modules</h2>
               <div className="flex flex-wrap gap-2 md:gap-3">
                 {content.skills.map((s, i) => <span key={i} className="px-3 md:px-4 py-1.5 md:py-2 border border-white/10 text-[9px] md:text-[10px] font-bold hover:border-indigo-500/50 transition-colors">{s}</span>)}
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {content.projects.map((p, i) => (
              <div key={i} className="border border-white/5 p-10 bg-white/[0.01] hover:bg-white/[0.03] transition-all group">
                <h3 className="text-2xl font-black uppercase mb-4 group-hover:text-indigo-400 transition-colors">{p.title}</h3>
                <p className="text-sm opacity-40 mb-10 leading-relaxed font-bold">{p.description}</p>
                <div className="flex flex-wrap gap-2 mt-auto">
                  {p.tech.map((t, j) => <span key={j} className="text-[10px] font-bold opacity-60">[{t}]</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div className="min-h-full bg-white transition-colors duration-500" style={responsiveStyles}>
        <div className="max-w-5xl mx-auto py-12 md:py-24 lg:py-40 px-6 md:px-10">
          <header className="mb-16 md:mb-24 lg:mb-40">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl lg:text-9xl font-bold mb-6 lg:mb-12 tracking-tighter leading-[0.85] break-words max-w-full"
            >
              <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </motion.h1>
            <div className="flex flex-wrap items-end justify-between gap-6 md:gap-12">
              <div className="text-xl md:text-3xl lg:text-5xl text-neutral-400 max-w-3xl leading-[1.1] tracking-tight font-medium">
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </div>
              <div className="flex gap-4 md:gap-8">
                {content.contact.github && <a href={content.contact.github} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Github className="w-5 h-5 md:w-8 md:h-8" /></a>}
                {content.contact.linkedin && <a href={content.contact.linkedin} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Linkedin className="w-5 h-5 md:w-8 md:h-8" /></a>}
                <a href={`mailto:${content.contact.email}`} className="text-neutral-300 hover:text-neutral-900 transition-all hover:scale-110"><Mail className="w-5 h-5 md:w-8 md:h-8" /></a>
              </div>
            </div>
          </header>

          <section className="mb-16 md:mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">01 / About</h2>
            </div>
            <div className="lg:col-span-8">
              <div className={cn(
                "text-lg md:text-2xl lg:text-4xl leading-snug text-neutral-800 font-medium tracking-tight",
                isRecruiterView && "bg-amber-50 p-6 md:p-12 rounded-[2rem] border border-amber-100 shadow-xl shadow-amber-900/5"
              )}>
                {isRecruiterView && (
                  <div className="flex items-center gap-3 mb-4 md:mb-8 text-amber-600">
                    <div className="px-3 py-1 bg-amber-600 text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-full">Recruiter Insight</div>
                    <div className="h-px flex-1 bg-amber-200" />
                  </div>
                )}
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
            </div>
          </section>

          <section className="mb-16 md:mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">02 / Expertise</h2>
            </div>
            <div className="lg:col-span-8">
              <div className="flex flex-wrap gap-2 md:gap-4">
                {content.skills.map((skill, i) => (
                  <span key={i} className={cn(
                    "px-4 md:px-10 py-2 md:py-5 rounded-xl md:rounded-3xl text-sm md:text-xl font-bold transition-all duration-500",
                    isRecruiterView 
                      ? "text-white shadow-2xl scale-105" 
                      : "bg-neutral-50 text-neutral-800 border border-neutral-100 hover:border-neutral-300"
                  )} style={isRecruiterView ? { backgroundColor: themeColor, boxShadow: `0 20px 50px ${themeColor}40` } : {}}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section className="mb-16 md:mb-24 lg:mb-40 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12">
            <div className="lg:col-span-4">
              <h2 className="text-[10px] uppercase tracking-[0.4em] text-neutral-300 font-black">03 / Experience</h2>
            </div>
            <div className="lg:col-span-8 space-y-12 md:space-y-32">
              {content.experience.map((exp, i) => (
                <div key={i} className="group">
                  <div className="flex flex-wrap justify-between items-baseline gap-3 mb-4 md:mb-8">
                    <h3 className="text-2xl md:text-5xl font-bold tracking-tighter">{exp.company}</h3>
                    <span className="text-neutral-300 font-mono text-[10px] md:text-sm font-bold">{exp.duration}</span>
                  </div>
                  <p className="text-lg md:text-2xl font-bold mb-4 md:mb-10 tracking-tight" style={{ color: themeColor }}>{exp.role}</p>
                  <ul className="space-y-3 md:space-y-6 text-base md:text-xl text-neutral-500 leading-relaxed max-w-3xl">
                    {exp.description.map((bullet, j) => (
                      <li key={j} className="flex gap-3 md:gap-5">
                        <span className="text-neutral-200 mt-2 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
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
      <div className="min-h-full bg-[#050505] text-slate-400 selection:bg-indigo-500/30 selection:text-white transition-colors duration-500" style={responsiveStyles}>
        <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
          <aside className="lg:col-span-5 lg:sticky lg:top-24 h-fit">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black uppercase tracking-widest mb-6 lg:mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Available for hire
              </div>
              <h1 className="text-3xl md:text-6xl lg:text-8xl font-black text-white mb-4 md:mb-8 tracking-tighter leading-none break-words">
                <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
              </h1>
              <h2 className="text-lg md:text-2xl lg:text-3xl mb-6 md:mb-12 font-bold tracking-tight" style={{ color: themeColor }}>
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </h2>
              <div className="text-slate-500 leading-relaxed mb-10 md:mb-16 text-base md:text-xl max-w-md">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>

              <div className="mb-10 md:mb-20">
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-700 mb-4 md:mb-8">Core Stack</h3>
                <div className="flex flex-wrap gap-2 lg:gap-3">
                  {content.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 lg:px-4 lg:py-2 bg-white/5 text-indigo-400 text-[10px] lg:text-[11px] font-bold rounded-lg lg:rounded-xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <nav className="space-y-6 lg:space-y-8 mb-12 hidden lg:block">
                {['Experience', 'Projects', 'Education'].map((item) => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="flex items-center gap-6 lg:gap-8 group text-slate-600 hover:text-white transition-all">
                    <div className="h-px w-8 lg:w-12 bg-slate-800 group-hover:w-16 lg:group-hover:w-24 group-hover:bg-indigo-500 transition-all duration-500" />
                    <span className="text-[9px] lg:text-xs font-black uppercase tracking-[0.4em]">{item}</span>
                  </a>
                ))}
              </nav>

              <div className="flex gap-6 md:gap-10">
                {content.contact.github && <a href={content.contact.github} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Github className="w-5 h-5 md:w-8 md:h-8" /></a>}
                {content.contact.linkedin && <a href={content.contact.linkedin} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Linkedin className="w-5 h-5 md:w-8 md:h-8" /></a>}
                <a href={`mailto:${content.contact.email}`} className="text-slate-600 hover:text-white transition-all hover:scale-125"><Mail className="w-5 h-5 md:w-8 md:h-8" /></a>
              </div>
            </motion.div>
          </aside>

          <main className="lg:col-span-7 space-y-24 md:space-y-48">
            <section id="experience" className="space-y-12 md:space-y-20">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-800 mb-8 md:mb-16">01 / Experience</h3>
              {content.experience.map((exp, i) => (
                <div key={i} className="group relative grid grid-cols-1 sm:grid-cols-4 gap-4 md:gap-8 hover:bg-white/[0.03] p-6 lg:p-10 rounded-2xl lg:rounded-[3rem] transition-all duration-700 border border-transparent hover:border-white/5">
                  <div className="sm:col-span-1 text-[9px] md:text-[11px] font-black text-slate-700 uppercase tracking-widest pt-1 md:pt-2">
                    {exp.duration}
                  </div>
                  <div className="sm:col-span-3">
                    <h3 className="text-white font-black text-xl md:text-2xl mb-1 lg:mb-2 group-hover:text-indigo-400 transition-colors">{exp.role}</h3>
                    <p className="text-slate-500 font-bold text-sm md:text-lg mb-4 md:mb-8">{exp.company}</p>
                    <ul className="space-y-3 lg:space-y-4 text-xs md:text-base text-slate-500 leading-relaxed">
                      {exp.description.map((bullet, j) => (
                        <li key={j} className="flex gap-3 lg:gap-4">
                          <span className="text-indigo-500/40 mt-1 md:mt-2">»</span>
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
      <div className="bg-[#f8f9ff] text-neutral-900 min-h-full selection:bg-indigo-600 selection:text-white transition-colors duration-500" style={responsiveStyles}>
        <div className="max-w-7xl mx-auto p-6 md:p-10 lg:p-24">
          <header className="mb-12 md:mb-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <h1 className="text-4xl md:text-7xl lg:text-9xl font-bold tracking-tighter leading-[0.85] mb-6 md:mb-12 break-words max-w-full">
                <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
              </h1>
              <div className="text-lg md:text-3xl lg:text-5xl text-neutral-500 font-medium tracking-tight leading-tight max-w-full">
                <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
              </div>
            </motion.div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {/* About & Skills - Bento Style */}
            <div className="lg:col-span-8 bg-white rounded-[2rem] lg:rounded-[3rem] p-6 md:p-12 shadow-2xl shadow-indigo-500/5 border border-neutral-100">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10" style={{ color: themeColor }}>About</h2>
              <div className="text-lg md:text-2xl lg:text-4xl leading-snug font-medium tracking-tight text-neutral-800 mb-8 md:mb-16">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
              <div className="flex flex-wrap gap-2 lg:gap-3">
                {content.skills.map((skill, i) => (
                  <span key={i} className="px-3 md:px-6 py-2 md:py-3 bg-neutral-50 text-neutral-900 text-[10px] md:text-sm font-bold rounded-lg md:rounded-2xl border border-neutral-100">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Contact - Bento Style */}
            <div className="lg:col-span-4 bg-indigo-600 rounded-[2rem] lg:rounded-[3rem] p-6 md:p-12 text-white shadow-2xl shadow-indigo-500/20 flex flex-col justify-between min-h-[300px]">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 mb-6 md:mb-10">Connect</h2>
              <div className="space-y-4 md:space-y-8">
                <a href={`mailto:${content.contact.email}`} className="block group">
                  <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">Email</p>
                  <p className="text-base md:text-2xl font-bold group-hover:translate-x-2 transition-transform flex items-center gap-3 break-all">
                    {content.contact.email} <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                  </p>
                </a>
                {content.contact.linkedin && (
                  <a href={content.contact.linkedin} className="block group">
                    <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-1">LinkedIn</p>
                    <p className="text-base md:text-2xl font-bold group-hover:translate-x-2 transition-transform flex items-center gap-3">
                      View Profile <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                    </p>
                  </a>
                )}
              </div>
            </div>

            {/* Projects - Bento Style */}
            {content.projects.map((project, i) => (
              <div key={i} className={cn(
                "rounded-[2rem] lg:rounded-[3rem] p-6 md:p-12 shadow-2xl shadow-neutral-500/5 border border-neutral-100 group transition-all duration-700",
                i % 3 === 0 ? "lg:col-span-8 bg-white" : "lg:col-span-4 bg-white"
              )}>
                <div className="flex justify-between items-start mb-4 md:mb-8">
                  <h3 className="text-xl md:text-3xl font-bold tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{project.title}</h3>
                  <div className="w-8 h-8 md:w-12 md:h-12 rounded-xl bg-neutral-50 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <ExternalLink className="w-3.5 h-3.5 md:w-5 md:h-5" />
                  </div>
                </div>
                <p className="text-neutral-500 text-sm md:text-lg mb-6 md:mb-12 leading-relaxed font-medium line-clamp-3">{project.description}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tech.map((t, j) => (
                    <span key={j} className="px-2 md:px-4 py-1 md:py-2 bg-neutral-50 text-neutral-400 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-md md:rounded-xl border border-neutral-100">{t}</span>
                  ))}
                </div>
              </div>
            ))}

            {/* Experience - Bento Style */}
            <div className="lg:col-span-12 bg-white rounded-[2rem] lg:rounded-[3rem] p-6 md:p-20 shadow-2xl shadow-indigo-500/5 border border-neutral-100">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 mb-8 md:mb-16 uppercase">Experience</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-16">
                {content.experience.map((exp, i) => (
                  <div key={i} className="space-y-3 md:space-y-6">
                    <div className="flex justify-between items-baseline gap-2">
                      <h3 className="text-lg md:text-2xl font-bold tracking-tight uppercase leading-tight">{exp.company}</h3>
                      <span className="text-neutral-300 font-mono text-[9px] md:text-xs font-bold shrink-0">{exp.duration}</span>
                    </div>
                    <p className="text-indigo-600 font-bold text-sm md:text-lg">{exp.role}</p>
                    <ul className="space-y-2 md:space-y-3 text-xs md:text-base text-neutral-500 leading-relaxed font-medium">
                      {exp.description.slice(0, 2).map((bullet, j) => (
                        <li key={j} className="flex gap-2 underline-offset-4">
                          <span className="text-indigo-200 mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
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
    <div className="bg-[#fdfdfb] text-neutral-900 min-h-full selection:bg-neutral-900 selection:text-white transition-colors duration-500" style={responsiveStyles}>
      <div className="max-w-6xl mx-auto px-6 md:px-10 lg:px-24 py-12 md:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-24 border-b-2 border-neutral-900 pb-12 md:pb-24 mb-12 md:mb-24">
          <div className="lg:col-span-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl sm:text-6xl lg:text-9xl font-black mb-6 md:mb-12 leading-[0.85] tracking-tighter break-words max-w-full"
            >
              <EditableText path="hero.name" label="Name" value={content.hero.name} onSave={(v: string) => updateField('hero.name', v)} />
            </motion.h1>
            <div className="text-lg md:text-3xl lg:text-4xl text-neutral-400 italic font-light tracking-tight max-w-full">
              <EditableText path="hero.headline" label="Headline" value={content.hero.headline} onSave={(v: string) => updateField('hero.headline', v)} />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col justify-end space-y-4 md:space-y-6 text-left lg:text-right">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">Contact</p>
              <p className="text-base md:text-xl font-bold break-all">{content.contact.email}</p>
            </div>
            {content.contact.linkedin && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">LinkedIn</p>
                <p className="text-base md:text-xl font-bold truncate">{content.contact.linkedin.replace('https://', '')}</p>
              </div>
            )}
            {content.contact.github && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-300">GitHub</p>
                <p className="text-base md:text-xl font-bold truncate">{content.contact.github.replace('https://', '')}</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 md:gap-24">
          <div className="lg:col-span-4 space-y-12 md:space-y-20">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-6 md:mb-10">Expertise</h2>
              <div className="space-y-3 md:space-y-6">
                {content.skills.map((skill, i) => (
                  <div key={i} className="text-lg md:text-2xl font-bold border-b-2 border-neutral-100 pb-2 md:pb-4 hover:border-neutral-900 transition-colors cursor-default uppercase">
                    {skill}
                  </div>
                ))}
              </div>
            </section>
            
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-6 md:mb-10">Education</h2>
              <div className="space-y-6 md:space-y-10">
                {content.education.map((edu, i) => (
                  <div key={i} className="group">
                    <p className="text-lg md:text-2xl font-black mb-1 uppercase tracking-tight leading-tight">{edu.school}</p>
                    <p className="text-sm md:text-lg text-neutral-500 italic mb-2">{edu.degree}</p>
                    <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-neutral-300">{edu.year}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="lg:col-span-8 space-y-16 md:space-y-32">
            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-6 md:mb-12">Professional Narrative</h2>
              <div className="text-lg md:text-2xl lg:text-4xl leading-[1.3] font-light text-neutral-800 tracking-tight">
                <EditableText path="about" label="About" multiline value={content.about} onSave={(v: string) => updateField('about', v)} />
              </div>
            </section>

            <section>
              <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-900 mb-8 md:mb-16">Selected Experience</h2>
              <div className="space-y-12 md:space-y-24">
                {content.experience.map((exp, i) => (
                  <div key={i} className="relative">
                    <div className="flex flex-wrap justify-between items-baseline gap-3 md:gap-6 mb-4 md:mb-8">
                      <h3 className="text-2xl md:text-5xl font-black tracking-tighter uppercase">{exp.company}</h3>
                      <span className="text-neutral-300 italic text-base md:text-xl shrink-0">{exp.duration}</span>
                    </div>
                    <p className="text-lg md:text-2xl text-neutral-400 italic mb-6 md:mb-10">{exp.role}</p>
                    <ul className="space-y-3 md:space-y-6 text-base md:text-xl leading-relaxed text-neutral-600 max-w-2xl">
                      {exp.description.map((bullet, j) => (
                        <li key={j} className="relative pl-6 md:pl-10">
                          <span className="absolute left-0 top-3 w-3 md:w-4 h-[2px] bg-neutral-200" />
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
