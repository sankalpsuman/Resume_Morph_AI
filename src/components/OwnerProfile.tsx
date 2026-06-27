import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Mail, Phone, Linkedin, MapPin, Briefcase, Award, Code2, Cpu, Rocket, ChevronRight, Github, Terminal, Sparkles, ShieldCheck, Zap } from 'lucide-react';

interface OwnerProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function OwnerProfile({ isOpen, onClose }: OwnerProfileProps) {
  const skills = {
    ai: ["Generative AI", "Prompt Engineering", "LLM Validation", "NLP/NLU Testing", "TOON™ Optimization"],
    automation: ["Python", "Selenium", "API Automation", "BDD Frameworks", "ETL Validation"],
    devops: ["AWS (Lambda/CloudWatch)", "CI/CD Pipelines", "Docker", "Jenkins", "Linux"]
  };

  const experience = [
    {
      role: "Software Test Specialist & Scrum Master (Gen AI Focus)",
      company: "Amdocs",
      dates: "Dec 2021 – Present",
      bullets: [
        "Spearheading GenAI integration into enterprise testing lifecycles.",
        "Reduced regression effort by ~30% through AI-assisted automation.",
        "Architecting complex AI-driven defect analysis workflows."
      ]
    },
    {
      role: "Senior Quality Engineer (Adobe Client)",
      company: "Hexaview",
      dates: "Jun 2019 – Dec 2021",
      bullets: [
        "Validated AI output accuracy for Adobe Acrobat Liquid Mode.",
        "Designed edge-case scenarios for AI document reflow analysis."
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[250] overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            onClick={onClose}
            className="fixed inset-0 bg-[var(--bg-primary)]/80 backdrop-blur-xl"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            className="relative min-h-screen flex items-center justify-center p-4 md:p-8 pointer-events-none"
          >
            <div className="bg-[var(--bg-primary)] w-full max-w-6xl rounded-[24px] md:rounded-[40px] border border-[var(--border-color)] shadow-2xl overflow-hidden pointer-events-auto flex flex-col lg:flex-row max-h-[95vh] md:max-h-[90vh]">
              
              {/* Left Column: Fixed Bio */}
              <div className="lg:w-72 bg-indigo-600 p-6 text-white flex flex-col justify-between shrink-0 overflow-y-auto lg:overflow-visible">
                <div className="space-y-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-white/10 backdrop-blur-lg rounded-2xl p-0.5 relative group mx-auto lg:mx-0">
                    <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center shadow-lg">
                      <span className="text-xl md:text-2xl font-black text-indigo-600">SS</span>
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center border-2 border-indigo-600">
                      <Sparkles className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                  
                  <div className="text-center lg:text-left">
                    <h2 className="text-2xl md:text-3xl font-black tracking-tighter leading-none mb-1">Sankalp Suman</h2>
                    <p className="text-indigo-100 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">AI-Engineer & QA Architect</p>
                  </div>

                  <div className="space-y-2 pt-4 border-t border-white/10 text-[10px] md:text-xs">
                    <a href="mailto:sankalpsmn@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors text-indigo-100 italic">
                      <Mail className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">sankalpsmn@gmail.com</span>
                    </a>
                    <div className="flex items-center gap-2 text-indigo-100 italic">
                      <Phone className="w-3.5 h-3.5 shrink-0" /> +91 9540446448
                    </div>
                    <a href="https://linkedin.com/in/sankalpsuman" target="_blank" className="flex items-center gap-2 text-indigo-100 italic hover:text-white">
                      <Linkedin className="w-3.5 h-3.5 shrink-0" /> in/sankalpsuman
                    </a>
                    <div className="flex items-center gap-2 text-indigo-100 italic">
                      <MapPin className="w-3.5 h-3.5 shrink-0" /> Delhi NCR, India
                    </div>
                  </div>
                </div>

                <button onClick={onClose} className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-200 hover:text-white transition-colors py-3 border-t border-white/5 lg:border-none">
                  <X className="w-3.5 h-3.5" /> Close Profile
                </button>
              </div>

              {/* Right Column: Scrollable Portfolio */}
              <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[var(--bg-secondary)]/30">
                <div className="space-y-10 md:space-y-12">
                  
                  {/* Summary */}
                  <section className="space-y-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                      Summary
                    </div>
                    <p className="text-lg md:text-xl font-medium text-[var(--text-secondary)] leading-relaxed tracking-tight">
                      QA Lead and Gen AI Architect with <span className="text-indigo-600 font-bold">7+ years</span> of expertise. Specialized in leveraging LLMs to transform software lifecycles into AI-accelerated workflows.
                    </p>
                  </section>

                  {/* Featured Project: Resume Morph */}
                  <section className="space-y-6 text-left">
                    <div className="flex items-center justify-between gap-4">
                      <h3 className="text-lg md:text-xl font-black tracking-tight text-[var(--text-primary)] shrink-0">Featured Innovation</h3>
                      <div className="h-px flex-1 bg-[var(--border-color)]" />
                    </div>
                    
                    <div className="bg-[var(--bg-primary)] rounded-[24px] md:rounded-[32px] border border-[var(--border-color)] overflow-hidden shadow-lg group">
                       <div className="p-5 md:p-8 space-y-6">
                          <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
                             <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center p-0.5 shrink-0 rotate-3 group-hover:rotate-0 transition-transform">
                                <div className="w-full h-full bg-slate-900 rounded-lg md:rounded-xl flex items-center justify-center">
                                   <Zap className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                                </div>
                             </div>
                             <div className="space-y-1">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                   <h4 className="text-xl md:text-2xl font-black tracking-tighter text-[var(--text-primary)]">Resume Morph AI</h4>
                                   <span className="inline-block px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[8px] font-black uppercase tracking-widest self-start sm:self-center">Production</span>
                                </div>
                                <p className="text-[var(--text-secondary)] font-medium text-sm md:text-base leading-relaxed">
                                   A full-stack AI ecosystem designed to clone professional resumes with pixel-perfect accuracy. Solves the visual-gap in job applications.
                                </p>
                             </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-left">
                             {[
                               { label: "Core Tech", val: "Gemini 1.5 Pro" },
                               { label: "Architecture", val: "TOON™ Encoding" },
                               { label: "Performance", val: "-40% Tokens" },
                               { label: "Output", val: "A4 Clean" }
                             ].map(t => (
                               <div key={t.label} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">{t.label}</p>
                                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 truncate">{t.val}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* Skills Grid */}
                  <section className="grid md:grid-cols-3 gap-4">
                     {Object.entries(skills).map(([key, vals]) => (
                       <div key={key} className="p-6 bg-white dark:bg-slate-900/50 rounded-[24px] border border-[var(--border-color)] space-y-4">
                          <div className="inline-flex items-center gap-2 text-indigo-600">
                             {key === 'ai' ? <Cpu className="w-4 h-4" /> : key === 'automation' ? <Terminal className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                             <h4 className="font-black text-xs uppercase tracking-widest">{key === 'ai' ? 'AI & LLM' : key === 'automation' ? 'Automation' : 'Cloud & DevOps'}</h4>
                          </div>
                          <ul className="space-y-2">
                             {vals.map(v => (
                               <li key={v} className="flex items-start gap-2 text-xs text-[var(--text-secondary)] font-medium">
                                  <ChevronRight className="w-3.5 h-3.5 text-indigo-300 shrink-0 mt-0.5" />
                                  {v}
                               </li>
                             ))}
                          </ul>
                       </div>
                     ))}
                  </section>

                  {/* Career Timeline */}
                  <section className="space-y-6">
                     <h3 className="text-xl font-black tracking-tight text-[var(--text-primary)]">Career Journey</h3>
                     <div className="space-y-6 relative">
                        <div className="absolute left-5 top-8 bottom-8 w-px bg-indigo-100 dark:bg-slate-800" />
                        {experience.map((exp, i) => (
                           <div key={i} className="flex gap-6 relative z-10 group">
                              <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 group-hover:bg-indigo-600 transition-colors">
                                 <Briefcase className="w-5 h-5 text-indigo-600 group-hover:text-white transition-colors" />
                              </div>
                              <div className="space-y-3 flex-1">
                                 <div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">{exp.dates}</span>
                                    <h4 className="text-lg font-bold text-[var(--text-primary)] leading-tight">{exp.role}</h4>
                                    <p className="font-black text-xs text-[var(--text-tertiary)] italic">@ {exp.company}</p>
                                 </div>
                                 <ul className="space-y-1.5">
                                    {exp.bullets.map((b, bi) => (
                                       <li key={bi} className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">• {b}</li>
                                    ))}
                                 </ul>
                              </div>
                           </div>
                        ))}
                     </div>
                  </section>

                  {/* Footer */}
                  <div className="text-center pt-8 border-t border-[var(--border-color)]">
                     <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Sankalp Suman • 2026</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
