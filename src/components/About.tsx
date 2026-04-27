import React from 'react';
import { motion } from 'motion/react';
import { 
  Github, Linkedin, Mail, ExternalLink, Award, Zap, Shield, 
  Globe, Cpu, Sparkles, RefreshCw, Rocket, Layers 
} from 'lucide-react';

export default function About() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-indigo-100 py-12 md:py-20 rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] overflow-hidden relative transition-colors duration-300">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[10%] left-[-10%] w-[500px] h-[500px] bg-purple-50/50 dark:bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-12 shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            Strategic Career Engineering
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter text-[var(--text-primary)] mb-8 md:mb-12 leading-[1.1] md:leading-[0.8]"
          >
            Re-architecting <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Professional Identity.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-2xl text-[var(--text-secondary)] font-medium max-w-3xl mx-auto leading-relaxed px-4"
          >
            Resume Morph is a high-fidelity style cloning engine. We bridge the structural gap between your expertise and your dream role's aesthetic with mathematical precision.
          </motion.p>
        </div>

      {/* Purpose & Features - Bento Grid Style */}
      <section className="py-16 md:py-32 border-y border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 md:p-10 bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] group transition-all"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 rounded-xl md:rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-none flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <Cpu className="w-6 md:w-7 h-6 md:h-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-3 md:mb-4 text-[var(--text-primary)]">Style Cloning</h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-xs md:text-base">
                Our AI analyzes the visual DNA of any reference resume—layout, typography, and spacing—and applies it to your data instantly.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 md:p-10 bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] group transition-all"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-purple-600 rounded-xl md:rounded-2xl shadow-xl shadow-purple-100 dark:shadow-none flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <Zap className="w-6 md:w-7 h-6 md:h-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-3 md:mb-4 text-[var(--text-primary)]">Role Optimization</h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-xs md:text-base">
                Targeted morphing ensures your skills are emphasized for specific job descriptions without ever compromising the truth of your experience.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 md:p-10 bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] group transition-all"
            >
              <div className="w-12 h-12 md:w-14 md:h-14 bg-emerald-600 rounded-xl md:rounded-2xl shadow-xl shadow-emerald-100 dark:shadow-none flex items-center justify-center mb-6 md:mb-8 group-hover:scale-110 transition-transform">
                <Shield className="w-6 md:w-7 h-6 md:h-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-black tracking-tight mb-3 md:mb-4 text-[var(--text-primary)]">Data Integrity</h3>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-xs md:text-base">
                We strictly enforce a "No Hallucination" policy. Your original projects and responsibilities are preserved, just presented better.
              </p>
            </motion.div>
          </div>
        </div>
      </section>


      {/* The Story Section */}
      <section className="py-12 md:py-24 overflow-hidden bg-[var(--bg-primary)]">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-full text-purple-600 dark:text-purple-400 text-[10px] font-black uppercase tracking-widest border border-purple-100 dark:border-purple-800">
                <Globe className="w-3 h-3" />
                The Origin Story
              </div>
              <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-[var(--text-primary)] leading-[1.1]">
                Born from <br />
                <span className="text-indigo-600">Frustration.</span> <br />
                Built for <br />
                <span className="text-purple-600">Precision.</span>
              </h2>
              <div className="space-y-4 md:space-y-6 text-[var(--text-secondary)] font-medium text-sm md:text-lg leading-relaxed">
                <p>
                  The idea for Resume Morph didn't come from a boardroom—it came from a personal struggle. While updating his own resume, Sankalp Suman realized how broken the process was.
                </p>
                <p>
                  As a Software Test Specialist at Amdocs, he applied his QA mindset to the problem: Why manually format when you can build a system that 'tests' and 'morphs' design automatically?
                </p>
                <p className="text-indigo-600 dark:text-indigo-400 font-bold">
                  Today, Resume Morph is a premium, paid service designed for those who refuse to settle for generic templates and demand professional-grade precision.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="relative"
            >
              <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-[28px] md:rounded-[40px] p-6 md:p-12 space-y-6 md:space-y-8 relative z-10 border border-indigo-100 dark:border-indigo-800">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Cpu className="text-white w-5 h-5 md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-2xl font-black tracking-tight text-[var(--text-primary)]">The Technology</h3>
                <p className="text-xs md:text-base text-[var(--text-secondary)] font-medium leading-relaxed">
                  Powered by advanced Large Language Models and a custom "Visual DNA" extraction engine, Resume Morph doesn't just fill templates. It understands the structural essence of high-performing resumes and reconstructs your professional history with surgical accuracy.
                </p>
                <div className="pt-6 border-t border-indigo-100 dark:border-indigo-800 flex items-center gap-4">
                  <div className="flex -space-x-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[var(--bg-primary)] bg-indigo-200 dark:bg-indigo-800" />
                    ))}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Trusted by 500+ Users</span>
                </div>
              </div>
              {/* Decorative background blur */}
              <div className="absolute -top-10 -right-10 w-48 h-48 md:w-64 md:h-64 bg-purple-200/30 rounded-full blur-3xl -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Portfolio Generator Story */}
      <section className="py-12 md:py-24 bg-indigo-50/30 dark:bg-indigo-900/10">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="order-2 md:order-1"
            >
              <div className="bg-[var(--bg-primary)] rounded-[32px] md:rounded-[40px] p-8 md:p-10 shadow-2xl shadow-indigo-100 dark:shadow-none border border-[var(--border-color)] relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Rocket className="text-white w-6 md:w-8 h-6 md:h-8" />
                </div>
                <h3 className="text-2xl md:text-3xl font-black text-[var(--text-primary)] mb-4 md:mb-6 tracking-tight">Beyond the Paper.</h3>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6 md:mb-8 text-base md:text-lg">
                  A resume is a snapshot, but a portfolio is a story. We realized that in today's digital-first world, a static PDF isn't enough. You need a living, breathing presence that showcases your code, your projects, and your personality.
                </p>
                <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--bg-primary)] rounded-lg md:rounded-xl flex items-center justify-center shadow-sm shrink-0">
                    <Sparkles className="text-indigo-600 dark:text-indigo-400 w-4 md:w-5 h-4 md:h-5" />
                  </div>
                  <p className="text-xs md:text-sm font-bold text-indigo-900 dark:text-indigo-300">Instantly convert any resume into a premium SaaS-style portfolio.</p>
                </div>
              </div>
            </motion.div>

            <div className="space-y-6 md:space-y-8 order-1 md:order-2 px-4 md:px-0">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 dark:bg-indigo-900/40 rounded-full text-indigo-700 dark:text-indigo-300 text-[10px] font-black uppercase tracking-widest border border-indigo-200 dark:border-indigo-800">
                <Layers className="w-3 h-3" />
                New Feature: Portfolio Gen
              </div>
              <h2 className="text-3xl md:text-6xl font-black tracking-tighter text-[var(--text-primary)] leading-[0.9]">
                The Next <br />
                <span className="text-indigo-600">Evolution.</span>
              </h2>
              <p className="text-base md:text-xl text-[var(--text-secondary)] font-medium leading-relaxed">
                We've integrated the same "Visual DNA" engine to not just format text, but to architect entire websites. Whether you're a student looking for your first internship or a senior dev targeting a lead role, our Portfolio Generator builds your digital home in seconds.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Developer Profile */}
      <section className="py-16 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-gray-900 rounded-[32px] md:rounded-[48px] p-8 md:p-20 relative overflow-hidden mb-12">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent" />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center relative z-10">
              <div className="space-y-6 md:space-y-8">
                <div>
                  <div className="inline-block px-4 py-1 bg-indigo-500/20 rounded-full text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-4">
                    Founder & SW Test Specialist
                  </div>
                  <h2 className="text-2xl md:text-5xl font-black text-white tracking-tight mb-4 md:mb-6">Sankalp Suman</h2>
                  <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed">
                    A dedicated QA Test Engineer currently working as a Software Test Specialist at Amdocs. Sankalp combines his expertise in software quality with a passion for building high-impact tools that solve real-world professional challenges.
                  </p>
                </div>

                <div className="flex flex-wrap gap-3 md:gap-4">
                  <a href="https://www.linkedin.com/in/sankalpsuman/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-white text-[10px] md:text-sm font-bold transition-all">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                  <a href="mailto:sankalpsmn@gmail.com" className="flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl md:rounded-2xl text-white text-[10px] md:text-sm font-bold transition-all shadow-xl shadow-indigo-500/20">
                    <Mail className="w-4 h-4" />
                    Get in Touch
                  </a>
                </div>

                <div className="grid grid-cols-2 gap-6 md:gap-8 pt-6 md:pt-8 border-t border-white/10">
                  <div>
                    <div className="text-xl md:text-3xl font-black text-white mb-1">500+</div>
                    <div className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">Resumes Morphed</div>
                  </div>
                  <div>
                    <div className="text-xl md:text-3xl font-black text-white mb-1">99%</div>
                    <div className="text-[9px] md:text-xs font-bold text-gray-500 uppercase tracking-widest">User Satisfaction</div>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-full max-w-[280px] md:max-w-md aspect-square bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-[32px] md:rounded-[48px] border border-white/10 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent_70%)]" />
                  <div className="relative z-10 flex flex-col items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-32 md:h-32 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/40 group-hover:scale-110 transition-transform duration-500">
                      <RefreshCw className="text-white w-8 h-8 md:w-16 md:h-16" />
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-3xl font-black text-white tracking-tighter text-shadow-glow">RESUME</div>
                      <div className="text-xl md:text-3xl font-black text-indigo-400 tracking-tighter -mt-1 md:-mt-2">MORPH</div>
                    </div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-4 -right-4 md:-bottom-6 md:-right-6 w-16 h-16 md:w-32 md:h-32 bg-indigo-600 rounded-2xl md:rounded-3xl -z-10 rotate-12 opacity-50" />
                <div className="absolute -top-4 -left-4 md:-top-6 md:-left-6 w-12 h-12 md:w-24 md:h-24 border-4 border-indigo-500/30 rounded-full -z-10" />
              </div>
            </div>
          </div>

          {/* Technical Architecture Section */}
          <div className="bg-[var(--bg-primary)] rounded-[32px] md:rounded-[48px] p-8 md:p-20 border border-[var(--border-color)] shadow-2xl shadow-indigo-100/20 dark:shadow-none">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 md:mb-8 border border-indigo-100 dark:border-indigo-800">
                <Layers className="w-3 h-3" />
                System Architecture
              </div>
              <h2 className="text-2xl md:text-5xl font-black text-[var(--text-primary)] tracking-tight mb-6 md:mb-8">How it's Built.</h2>
              
              <div className="space-y-8 md:space-y-12 text-sm md:text-base">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-3 md:space-y-4">
                    <h4 className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Frontend Stack</h4>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                      Built with <span className="text-[var(--text-primary)] font-bold">React 18</span> and <span className="text-[var(--text-primary)] font-bold">TypeScript</span> for a robust, type-safe development experience. Styling is handled via <span className="text-[var(--text-primary)] font-bold">Tailwind CSS</span>, utilizing utility-first principles for a highly customizable and responsive UI.
                    </p>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h4 className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Animations</h4>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                      Fluid transitions and interactive elements are powered by <span className="text-[var(--text-primary)] font-bold">Framer Motion</span>, ensuring a premium SaaS-like feel with smooth, hardware-accelerated animations.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                  <div className="space-y-3 md:space-y-4">
                    <h4 className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Backend & Database</h4>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                      Leverages <span className="text-[var(--text-primary)] font-bold">Firebase (Google Cloud)</span> for real-time data synchronization. <span className="text-[var(--text-primary)] font-bold">Firestore</span> acts as the primary NoSQL database, while <span className="text-[var(--text-primary)] font-bold">Firebase Authentication</span> handles secure user sessions.
                    </p>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h4 className="text-base md:text-lg font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Hosting & Deployment</h4>
                    <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                      The application is containerized and deployed on <span className="text-[var(--text-primary)] font-bold">Google Cloud Run</span>, providing serverless scalability and high availability across global regions.
                    </p>
                  </div>
                </div>

                <div className="p-6 md:p-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl md:rounded-3xl border border-indigo-100 dark:border-indigo-800">
                  <h4 className="text-base md:text-lg font-black text-indigo-900 dark:text-indigo-300 uppercase tracking-widest mb-3 md:mb-4">AI Integration</h4>
                  <p className="text-indigo-900/70 dark:text-indigo-300/70 font-medium leading-relaxed text-xs md:text-base">
                    The core "Morph Engine" utilizes <span className="text-indigo-900 dark:text-indigo-300 font-bold">Google Gemini AI</span> models to analyze resume structures and generate professional content. This integration allows for sophisticated style cloning and role-specific optimization that goes beyond simple keyword matching.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
