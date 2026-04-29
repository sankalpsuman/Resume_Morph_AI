import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Globe, Brain, Zap, Shield, Database, Layout, Code, Sparkles, Target, Cpu, Send, Briefcase, Star, Lightbulb, Rocket, ChevronRight, Minimize2, RefreshCw, ShieldCheck } from 'lucide-react';

interface ProjectDeepDiveProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProjectDeepDive({ isOpen, onClose }: ProjectDeepDiveProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            className="relative min-h-screen p-4 md:p-8 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-[var(--bg-primary)] w-full max-w-5xl rounded-[32px] md:rounded-[64px] shadow-2xl shadow-indigo-500/20 border border-[var(--border-color)] overflow-hidden pointer-events-auto flex flex-col max-h-[92vh] md:max-h-[90vh]">
              
              {/* Header */}
              <div className="p-6 md:p-12 border-b border-[var(--border-color)] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-4 md:gap-6">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none rotate-6 shrink-0">
                    <Rocket className="w-6 h-6 md:w-8 md:h-8 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-2xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)]">Project Intelligence</h2>
                    <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[8px] md:text-xs">Architecture & Vision Report</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-3 md:p-4 hover:bg-[var(--bg-secondary)] rounded-2xl transition-colors group"
                >
                  <X className="w-5 h-5 md:w-6 md:h-6 text-[var(--text-tertiary)] group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-16 custom-scrollbar">
                <div className="space-y-16 md:space-y-24">
                  
                  {/* Mission & Vision */}
                  <section className="space-y-8 md:space-y-12 text-left">
                    <div className="grid lg:grid-cols-2 gap-12 md:gap-16 items-center">
                      <div className="space-y-6 md:space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800">
                          <Target className="w-3 h-3" />
                          The Vision
                        </div>
                        <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none text-[var(--text-primary)]">
                          Solving the <br />
                          <span className="text-indigo-600 dark:text-indigo-400">Resume Struggle.</span>
                        </h3>
                        <p className="text-lg md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed">
                          Job seekers often possess the perfect talent but lack the "visual language" required to stand out. Resume Morph was built to equalize the playing field, allowing anyone to clone professional styles instantly while retaining data integrity.
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/10 blur-3xl rounded-full" />
                        <div className="relative p-6 md:p-8 bg-[var(--bg-secondary)] rounded-[32px] md:rounded-[48px] border border-[var(--border-color)] space-y-6">
                           <div className="flex gap-4">
                             <div className="w-10 h-10 md:w-12 md:h-12 bg-[var(--bg-primary)] rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg border border-[var(--border-color)]"><Globe className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" /></div>
                             <div className="flex-1 space-y-2">
                               <div className="h-3 md:h-4 bg-[var(--bg-primary)] rounded-full w-3/4" />
                               <div className="h-3 md:h-4 bg-[var(--bg-primary)] rounded-full w-1/2" />
                             </div>
                           </div>
                           <div className="py-2 md:py-4 border-y border-[var(--border-color)] flex justify-center">
                             <Zap className="w-6 h-6 md:w-8 md:h-8 text-amber-500 animate-pulse" />
                           </div>
                           <div className="flex items-center justify-between">
                             <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none" />
                             <div className="h-5 md:h-6 bg-indigo-600/20 rounded-full w-24 md:w-32" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* The Creator Section - SANKALP SUMAN */}
                  <section className="space-y-8 md:space-y-12 text-left">
                    <div className="p-1 gap-1 flex flex-col lg:flex-row items-stretch">
                       <div className="flex-[0.4] bg-indigo-600 p-8 md:p-12 rounded-[32px] md:rounded-[48px] text-white flex flex-col justify-between overflow-hidden relative group">
                          <div className="absolute bottom-0 right-0 w-64 h-64 bg-white/10 rounded-full -mb-32 -mr-32 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="space-y-6 relative z-10">
                             <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[24px] md:rounded-3xl flex items-center justify-center shadow-2xl">
                                <span className="text-2xl md:text-3xl font-black text-indigo-600">SS</span>
                             </div>
                             <div>
                               <h4 className="text-3xl md:text-4xl font-black tracking-tighter leading-none mb-2">Sankalp <br className="hidden md:block" />Suman</h4>
                               <p className="text-indigo-100 font-bold uppercase tracking-widest text-[9px] md:text-[10px]">Lead Architect & Full‑Stack AI Engineer</p>
                             </div>
                          </div>
                          <div className="pt-6 relative z-10">
                             <div className="flex items-center gap-2 text-indigo-200">
                                <Globe className="w-4 h-4" />
                                <span className="text-xs md:text-sm font-bold">Bangalore, India</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex-[0.6] bg-[var(--bg-secondary)] p-8 md:p-12 rounded-[32px] md:rounded-[48px] border border-[var(--border-color)] space-y-6 md:space-y-8">
                          <div className="space-y-4">
                             <h4 className="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight">The Mind Behind the Morph.</h4>
                             <p className="text-sm md:text-base text-[var(--text-secondary)] font-medium leading-relaxed">
                               This entire ecosystem was conceptualized, designed, and engineered from the ground up by **Sankalp Suman**. Frustrated by the friction in job applications, Sankalp built **Resume Morph** to bridge the gap between "having the skills" and "looking the part."
                             </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                             {[
                               { label: "AI Integration", value: "TOON™ Engine" },
                               { label: "Frontend", value: "React & Framer" },
                               { label: "Architecture", value: "Scalable SaaS" },
                               { label: "Database", value: "Realtime NoSQL" }
                             ].map((item, i) => (
                               <div key={i} className="p-3 md:p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)]">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">{item.label}</p>
                                  <p className="text-xs md:text-sm font-black text-indigo-600 dark:text-indigo-400">{item.value}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* TOON vs JSON - The AI Edge */}
                  <section className="space-y-8 md:space-y-12">
                    <div className="text-center space-y-4">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800">
                        <Cpu className="w-3 h-3" />
                        Innovation: TOON
                      </div>
                      <h3 className="text-3xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] leading-none">
                        Token-Oriented Object Notation
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8 text-left">
                       <div className="p-6 md:p-10 bg-[var(--bg-secondary)] rounded-[24px] md:rounded-[32px] border border-[var(--border-color)] space-y-4 md:space-y-6">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg md:text-xl font-black text-slate-400">Traditional JSON</h4>
                            <span className="px-2 md:px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">Inefficient</span>
                          </div>
                          <pre className="text-[8px] md:text-xs font-mono text-slate-500 leading-relaxed overflow-x-auto p-4 bg-[var(--bg-primary)] rounded-2xl border border-[var(--border-color)] shadow-inner">
{`{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@doe.com"
  },
  "experience": [
    {
      "company": "Google",
      "role": "Engineer"
    }
  ]
}`}
                          </pre>
                          <p className="text-xs md:text-sm text-slate-500 font-medium italic">High overhead due to redundant keys, quotes, and braces. Increases token usage and latency in LLM flows.</p>
                       </div>

                       <div className="p-6 md:p-10 bg-indigo-50 dark:bg-indigo-900/20 rounded-[24px] md:rounded-[48px] border border-indigo-200 dark:border-indigo-800 space-y-4 md:space-y-6 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="flex items-center justify-between relative z-10">
                            <h4 className="text-lg md:text-xl font-black text-indigo-600 dark:text-indigo-400">Modern TOON</h4>
                            <span className="px-2 md:px-3 py-1 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest">Optimized</span>
                          </div>
                          <pre className="relative z-10 text-[8px] md:text-xs font-mono text-indigo-600 dark:text-indigo-300 leading-relaxed overflow-x-auto p-4 bg-white/60 dark:bg-black/40 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
{`[RESUME]
  [PI]n:John Doe|e:john@doe.com[/PI]
  [EXP][ITEM]c:Google|r:Engineer[/ITEM][/EXP]
[/RESUME]`}
                          </pre>
                          <p className="text-xs md:text-sm text-indigo-700 dark:text-indigo-300 font-bold p-3 bg-white/40 dark:bg-black/20 rounded-xl relative z-10">
                            🚀 40% Lower Token Cost <br/>
                            ⚡ Faster AI Inference <br/>
                            🧠 Improved Prompt Density
                          </p>
                       </div>
                    </div>
                  </section>

                  {/* Architecture & Workflow */}
                  <section className="space-y-12">
                    <div className="flex flex-col md:flex-row gap-12 items-end">
                      <div className="flex-1 space-y-8">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800">
                          <Layout className="w-3 h-3" />
                          Architecture
                        </div>
                        <h3 className="text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-[0.9]">
                          The Intelligent <br />
                          <span className="text-purple-600">Morph Engine.</span>
                        </h3>
                        <div className="grid gap-6">
                           {[
                             { title: "Layout Analysis", desc: "Computer vision combined with semantic parsing to extract design tokens from reference resumes.", icon: Layout },
                             { title: "Dynamic Transformation", desc: "A recursive conversion layer that translates user data into industry-specific visual structures.", icon: RefreshCw },
                             { title: "ATS Fusion", desc: "Real-time semantic analysis to ensure the 'morphed' result is passing every ATS gate.", icon: ShieldCheck }
                           ].map((step, i) => (
                             <div key={i} className="flex gap-6 p-6 hover:bg-[var(--bg-secondary)] rounded-3xl transition-colors border border-transparent hover:border-[var(--border-color)]">
                               <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 rounded-xl flex items-center justify-center shrink-0">
                                 <step.icon className="w-6 h-6 text-purple-600" />
                               </div>
                               <div>
                                 <h4 className="font-black text-[var(--text-primary)] mb-1">{step.title}</h4>
                                 <p className="text-sm text-[var(--text-tertiary)] font-medium leading-relaxed">{step.desc}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="w-full lg:w-[400px] bg-slate-900 rounded-[48px] p-8 space-y-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                           <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                        </div>
                        <h4 className="font-black text-xs uppercase tracking-widest text-slate-500">Tech Stack</h4>
                        <div className="flex flex-wrap gap-2">
                           {['React 18', 'Vite', 'Tailwind', 'Firebase', 'Gemini AI', 'D3.js', 'Framer Motion', 'TypeScript'].map(t => (
                             <span key={t} className="px-4 py-2 bg-slate-800 rounded-xl text-xs font-bold border border-slate-700">{t}</span>
                           ))}
                        </div>
                        <div className="space-y-4 pt-8 border-t border-slate-800">
                           <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest text-slate-500">
                             <span>Stability</span>
                             <span>99.9%</span>
                           </div>
                           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                             <div className="w-[99.9%] h-full bg-indigo-500" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Personal Contribution & Skills */}
                  <section className="space-y-12">
                     <div className="p-12 md:p-20 bg-indigo-600 rounded-[64px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full -mr-300 -mt-300 blur-3xl" />
                        <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
                           <div className="space-y-8">
                             <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center p-0.5">
                                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center">
                                  <Star className="w-10 h-10 text-indigo-600" />
                                </div>
                             </div>
                             <h3 className="text-5xl font-black tracking-tighter leading-none">
                               Expertise of <br /> Sankalp Suman.
                             </h3>
                             <p className="text-xl text-indigo-100 font-medium leading-relaxed">
                               Leveraging a unique blend of AI engineering and product design to solve complex real-world problems. This project is a testament to Sankalp's ability to ship high-quality, production-ready AI applications.
                             </p>
                           </div>
                           <div className="grid sm:grid-cols-2 gap-6">
                              {[
                                { title: "Fullstack Engineering", desc: "Expertise in building scalable React applications with robust backends and real-time data sync.", icon: Shield },
                                { title: "Generative AI", desc: "Advanced prompt engineering and custom notation (TOON) to optimize LLM performance and cost.", icon: Brain },
                                { title: "Technical Product Design", desc: "Designing intuitive user experiences that simplify advanced AI functionalities for everyone.", icon: Sparkles },
                                { title: "Rapid Prototyping", desc: "Proven ability to take a complex idea and turn it into a high-fidelity working product within days.", icon: Cpu }
                              ].map((skill, i) => (
                                <div key={i} className="p-6 bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 space-y-4">
                                   <skill.icon className="w-6 h-6 text-white" />
                                   <div>
                                     <h4 className="font-black text-sm mb-1">{skill.title}</h4>
                                     <p className="text-[10px] text-indigo-100 font-medium leading-relaxed">{skill.desc}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* Challenges Solved */}
                  <section className="space-y-12">
                    <div className="text-center space-y-4">
                      <h3 className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">Challenges & Solutions</h3>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8">
                       {[
                         { 
                           q: "The Layout Gap", 
                           a: "Solved by creating a Design-Tokens system that abstracts spacing and alignment into a structured manifest, allowing the AI to 'see' hierarchy.",
                           icon: Layout
                         },
                         { 
                           q: "Token Optimization", 
                           a: "Engineered TOON to overcome the verbosity of JSON, reducing costs by 40% without losing any data relationships.",
                           icon: Zap
                         },
                         { 
                           q: "Data Fidelity", 
                           a: "Implemented a clean conversion layer with automatic fallback systems to ensure user data is never lost during processing.",
                           icon: ShieldCheck
                         }
                       ].map((item, i) => (
                         <div key={i} className="p-8 bg-[var(--bg-secondary)] rounded-[40px] border border-[var(--border-color)] space-y-6">
                            <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border border-[var(--border-color)]">
                              <item.icon className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div className="space-y-2">
                              <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-[10px]">{item.q}</h4>
                              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{item.a}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Closing Call to Action */}
                  <section className="text-center space-y-12 pb-12">
                    <div className="max-w-2xl mx-auto space-y-6">
                      <h3 className="text-4xl font-black tracking-tighter text-[var(--text-primary)]">Ready for the Future?</h3>
                      <p className="text-lg text-[var(--text-secondary)] font-medium">
                        Resume Morph is proof that AI combined with professional design can create transformative experiences. I am ready to bring this level of innovation to your next project.
                      </p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="px-12 py-6 bg-indigo-600 text-white rounded-[32px] font-black text-sm uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-2xl shadow-indigo-100"
                    >
                      Close Report
                    </button>
                  </section>

                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
