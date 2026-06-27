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
            <div className="bg-[var(--bg-primary)] w-full max-w-6xl rounded-[24px] md:rounded-[40px] shadow-2xl shadow-indigo-500/10 border border-[var(--border-color)] overflow-hidden pointer-events-auto flex flex-col max-h-[95vh] md:max-h-[92vh]">
              
              {/* Header */}
              <div className="p-4 md:p-8 border-b border-[var(--border-color)] flex items-center justify-between shrink-0 bg-[var(--bg-secondary)]/30">
                <div className="flex items-center gap-3 md:gap-5">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg rotate-3 shrink-0">
                    <Rocket className="w-5 h-5 md:w-7 md:h-7 text-white" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)]">Project Intelligence</h2>
                    <p className="text-[var(--text-tertiary)] font-bold uppercase tracking-widest text-[7px] md:text-[10px]">Architecture & Vision Report</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 md:p-3 hover:bg-[var(--bg-secondary)] rounded-xl transition-colors group"
                >
                  <X className="w-5 h-5 text-[var(--text-tertiary)] group-hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                <div className="space-y-12 md:space-y-16">
                  
                  {/* Mission & Vision */}
                  <section className="space-y-6 text-left">
                    <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
                      <div className="space-y-4 md:space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-100 dark:border-indigo-800 w-fit">
                          <Target className="w-3 h-3" />
                          The Vision
                        </div>
                        <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none text-[var(--text-primary)]">
                          Solving the <br />
                          <span className="text-indigo-600 dark:text-indigo-400">Resume Struggle.</span>
                        </h3>
                        <p className="text-base md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                          Job seekers often possess the perfect talent but lack the "visual language" required to stand out. Resume Morph was built to equalize the playing field, allowing anyone to clone professional styles instantly while retaining data integrity.
                        </p>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full" />
                        <div className="relative p-5 md:p-8 bg-[var(--bg-secondary)]/50 rounded-[24px] md:rounded-[32px] border border-[var(--border-color)] space-y-5">
                           <div className="flex gap-3">
                             <div className="w-10 h-10 bg-[var(--bg-primary)] rounded-xl flex items-center justify-center shadow-md border border-[var(--border-color)]"><Globe className="w-5 h-5 text-indigo-600" /></div>
                             <div className="flex-1 space-y-2 pt-2">
                               <div className="h-2.5 bg-[var(--bg-primary)] rounded-full w-3/4" />
                               <div className="h-2.5 bg-[var(--bg-primary)] rounded-full w-1/2" />
                             </div>
                           </div>
                           <div className="py-2 border-y border-[var(--border-color)] flex justify-center">
                             <Zap className="w-6 h-6 text-amber-500 animate-pulse" />
                           </div>
                           <div className="flex items-center justify-between">
                             <div className="w-10 h-10 bg-indigo-600 rounded-xl shadow-lg" />
                             <div className="h-4 bg-indigo-600/20 rounded-full w-24" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* The Creator Section - SANKALP SUMAN */}
                  <section className="text-left">
                    <div className="gap-2 flex flex-col lg:flex-row items-stretch">
                       <div className="flex-[0.35] bg-indigo-600 p-6 md:p-8 rounded-[24px] md:rounded-[32px] text-white flex flex-col justify-between overflow-hidden relative group">
                          <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mb-24 -mr-24 blur-3xl group-hover:scale-150 transition-transform duration-700" />
                          <div className="space-y-4 relative z-10">
                             <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                                <span className="text-xl font-black text-indigo-600">SS</span>
                             </div>
                             <div>
                               <h4 className="text-2xl md:text-3xl font-black tracking-tighter leading-none mb-1">Sankalp Suman</h4>
                               <p className="text-indigo-100 font-bold uppercase tracking-widest text-[8px] md:text-[9px]">Lead Architect & Engineer</p>
                             </div>
                          </div>
                          <div className="pt-4 relative z-10 border-t border-white/10">
                             <div className="flex items-center gap-2 text-indigo-200">
                                <Globe className="w-3.5 h-3.5" />
                                <span className="text-[10px] md:text-xs font-bold">Bangalore, India</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="flex-[0.65] bg-[var(--bg-secondary)]/50 p-6 md:p-8 rounded-[24px] md:rounded-[32px] border border-[var(--border-color)] flex flex-col justify-center gap-6">
                          <div className="space-y-3">
                             <h4 className="text-lg md:text-xl font-black text-[var(--text-primary)] tracking-tight">The Mind Behind the Morph.</h4>
                             <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">
                               This ecosystem was engineered by **Sankalp Suman** to bridge the gap between "having the skills" and "looking the part." Frustrated by application friction, he built **Resume Morph** for instant style cloning with data integrity.
                             </p>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                             {[
                               { label: "AI Integration", value: "TOON™ Engine" },
                               { label: "Frontend", value: "React" },
                               { label: "Architecture", value: "SaaS" },
                               { label: "Database", value: "NoSQL" }
                             ].map((item, i) => (
                               <div key={i} className="p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                                  <p className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-0.5">{item.label}</p>
                                  <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 truncate">{item.value}</p>
                               </div>
                             ))}
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* TOON vs JSON - The AI Edge */}
                  <section className="space-y-8">
                    <div className="text-center space-y-3">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-800 mx-auto">
                        <Cpu className="w-3 h-3" />
                        Innovation: TOON
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)] leading-tight">
                        Token-Oriented Object Notation
                      </h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 text-left">
                       <div className="p-5 md:p-8 bg-[var(--bg-secondary)]/50 rounded-2xl md:rounded-3xl border border-[var(--border-color)] space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base md:text-lg font-black text-slate-400">Traditional JSON</h4>
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-full text-[8px] font-black uppercase tracking-widest">Inefficient</span>
                          </div>
                          <pre className="text-[8px] md:text-[10px] font-mono text-slate-500 leading-relaxed overflow-x-auto p-4 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] shadow-inner">
{`{
  "personalInfo": {
    "name": "John Doe",
    "email": "john@doe.com"
  },
  "experience": [
    { "company": "Google", "role": "Engineer" }
  ]
}`}
                          </pre>
                       </div>

                       <div className="p-5 md:p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl md:rounded-3xl border border-indigo-200 dark:border-indigo-800 space-y-4 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-400/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                          <div className="flex items-center justify-between relative z-10">
                            <h4 className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400">Modern TOON</h4>
                            <span className="px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-[8px] font-black uppercase tracking-widest">Optimized</span>
                          </div>
                          <pre className="relative z-10 text-[8px] md:text-[10px] font-mono text-indigo-600 dark:text-indigo-300 leading-relaxed overflow-x-auto p-4 bg-white/60 dark:bg-black/40 rounded-xl border border-indigo-100 dark:border-indigo-900/50 shadow-inner">
{`[RESUME]
  [PI]n:John Doe|e:john@doe.com[/PI]
  [EXP][ITEM]c:Google|r:Engineer[/ITEM][/EXP]
[/RESUME]`}
                          </pre>
                          <div className="flex gap-4 relative z-10">
                            <div className="flex-1 bg-white/40 dark:bg-black/20 p-2 rounded-lg text-center">
                              <p className="text-[8px] font-black uppercase text-indigo-500">Token Cost</p>
                              <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">-40%</p>
                            </div>
                            <div className="flex-1 bg-white/40 dark:bg-black/20 p-2 rounded-lg text-center">
                              <p className="text-[8px] font-black uppercase text-indigo-500">Inference</p>
                              <p className="text-xs font-black text-indigo-700 dark:text-indigo-300">Fast</p>
                            </div>
                          </div>
                       </div>
                    </div>
                  </section>

                  {/* Architecture & Workflow */}
                  <section className="space-y-10">
                    <div className="flex flex-col md:flex-row gap-10 items-stretch">
                      <div className="flex-1 space-y-6">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800">
                          <Layout className="w-3 h-3" />
                          Architecture
                        </div>
                        <h3 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text-primary)] leading-tight">
                          The Intelligent Morph Engine.
                        </h3>
                        <div className="grid gap-3">
                           {[
                             { title: "Layout Analysis", desc: "Computer vision combined with semantic parsing to extract design tokens.", icon: Layout },
                             { title: "Dynamic Transformation", desc: "Translates user data into industry-specific visual structures.", icon: RefreshCw },
                             { title: "ATS Fusion", desc: "Ensures the 'morphed' result is passing every ATS gate.", icon: ShieldCheck }
                           ].map((step, i) => (
                             <div key={i} className="flex gap-4 p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-transparent hover:border-[var(--border-color)] transition-all">
                               <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 rounded-lg flex items-center justify-center shrink-0">
                                 <step.icon className="w-5 h-5 text-purple-600" />
                               </div>
                               <div>
                                 <h4 className="font-black text-[var(--text-primary)] text-sm mb-0.5">{step.title}</h4>
                                 <p className="text-xs text-[var(--text-tertiary)] font-medium leading-relaxed">{step.desc}</p>
                               </div>
                             </div>
                           ))}
                        </div>
                      </div>
                      <div className="w-full lg:w-[320px] bg-slate-900 rounded-[32px] p-6 space-y-6 text-white relative overflow-hidden flex flex-col justify-center">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                           <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]" />
                        </div>
                        <h4 className="font-black text-[9px] uppercase tracking-widest text-slate-500">Tech Stack</h4>
                        <div className="flex flex-wrap gap-1.5">
                           {['React', 'Vite', 'Tailwind', 'Firebase', 'Gemini AI', 'TypeScript'].map(t => (
                             <span key={t} className="px-3 py-1 bg-slate-800 rounded-lg text-[10px] font-bold border border-slate-700">{t}</span>
                           ))}
                        </div>
                        <div className="space-y-2 pt-6 border-t border-slate-800">
                           <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-500">
                             <span>Stability</span>
                             <span>99.9%</span>
                           </div>
                           <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                             <div className="w-[99.9%] h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                           </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Personal Contribution & Skills */}
                  <section>
                     <div className="p-8 md:p-12 bg-indigo-600 rounded-[32px] md:rounded-[48px] text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/5 rounded-full -mr-200 -mt-200 blur-3xl" />
                        <div className="relative z-10 grid lg:grid-cols-2 gap-10 items-center">
                           <div className="space-y-6">
                             <div className="w-14 h-14 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center p-0.5">
                                <div className="w-full h-full bg-white rounded-xl flex items-center justify-center">
                                  <Star className="w-7 h-7 text-indigo-600" />
                                </div>
                             </div>
                             <h3 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                               Expertise of <br /> Sankalp Suman.
                             </h3>
                             <p className="text-lg text-indigo-100 font-medium leading-relaxed">
                               A blend of AI engineering and product design to solve complex problems. Shipping high-quality, production-ready AI applications.
                             </p>
                           </div>
                           <div className="grid sm:grid-cols-2 gap-4">
                              {[
                                { title: "Fullstack Eng", desc: "Expertise in building scalable React apps.", icon: Shield },
                                { title: "Generative AI", desc: "Advanced prompt engineering & custom notation.", icon: Brain },
                                { title: "Product Design", desc: "Designing intuitive user experiences.", icon: Sparkles },
                                { title: "Prototyping", desc: "Taking complex ideas to working products.", icon: Cpu }
                              ].map((skill, i) => (
                                <div key={i} className="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 space-y-3">
                                   <skill.icon className="w-5 h-5 text-white" />
                                   <div>
                                     <h4 className="font-black text-xs mb-0.5">{skill.title}</h4>
                                     <p className="text-[10px] text-indigo-100 font-medium leading-relaxed">{skill.desc}</p>
                                   </div>
                                </div>
                              ))}
                           </div>
                        </div>
                     </div>
                  </section>

                  {/* Challenges Solved */}
                  <section className="space-y-8">
                    <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)] text-center">Challenges & Solutions</h3>
                    <div className="grid md:grid-cols-3 gap-4">
                       {[
                         { 
                           q: "The Layout Gap", 
                           a: "Solved by creating a Design-Tokens system for structured hierarchy.",
                           icon: Layout
                         },
                         { 
                           q: "Optimization", 
                           a: "Engineered TOON to reduce costs by 40% without losing relationships.",
                           icon: Zap
                         },
                         { 
                           q: "Data Fidelity", 
                           a: "Clean conversion layer with automatic fallback systems.",
                           icon: ShieldCheck
                         }
                       ].map((item, i) => (
                         <div key={i} className="p-6 bg-[var(--bg-secondary)]/50 rounded-3xl border border-[var(--border-color)] space-y-4">
                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center border border-[var(--border-color)]">
                              <item.icon className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-[9px]">{item.q}</h4>
                              <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed">{item.a}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                  </section>

                  {/* Closing Call to Action */}
                  <section className="text-center space-y-8 pb-6 border-t border-[var(--border-color)] pt-12">
                    <div className="max-w-xl mx-auto space-y-4">
                      <h3 className="text-2xl md:text-3xl font-black tracking-tighter text-[var(--text-primary)]">Ready for the Future?</h3>
                      <p className="text-base text-[var(--text-secondary)] font-medium">
                        Resume Morph is proof that AI combined with professional design can create transformative experiences.
                      </p>
                    </div>
                    <button 
                      onClick={onClose}
                      className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-500 transition-all active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-none"
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
