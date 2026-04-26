import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { 
  BookOpen, 
  Layout, 
  Upload, 
  Zap, 
  Download, 
  Shield, 
  CheckCircle2, 
  ArrowRight,
  Sparkles,
  MousePointer2,
  FileText,
  History,
  Star,
  Eye,
  Trophy,
  MessageCircle,
  Clock,
  Rocket,
  Layers,
  Target,
  Globe
} from 'lucide-react';

export default function UserGuide() {
  const steps = [
    {
      id: "upload",
      title: "Upload & Morph",
      description: "Start by uploading your current resume or pasting your LinkedIn profile. Our Morph Engine handles the heavy lifting.",
      icon: Upload,
      color: "bg-blue-500",
      details: ["PDF/DOCX/TXT Support", "LinkedIn Import Modal", "Privacy-First Extraction"]
    },
    {
      id: "tailor",
      title: "Smart Tailoring",
      description: "Use the Analyze tab to check your ATS score and match your resume to a specific job description instantly.",
      icon: Target,
      color: "bg-amber-500",
      details: ["Real-time ATS Scoring", "JD Keyword Matcher", "Missing Section Alerts"]
    },
    {
      id: "optimize",
      title: "AI Optimization",
      description: "Refine every bullet point with our achieve-oriented rewriter. Create high-impact achievemetns effortlessly.",
      icon: Sparkles,
      color: "bg-purple-500",
      details: ["Achievement Rewriting", "Executive Length Modes", "Smart Section Controls"]
    },
    {
      id: "apply",
      title: "Track & Apply",
      description: "Generate tailored cover letters and track your applications in real-time with our built-in job board.",
      icon: Rocket,
      color: "bg-green-500",
      details: ["AI Cover Letter Gen", "Application Dashboard", "Live Progress Tracking"]
    }
  ];

  const features = [
    { id: "ats", title: "ATS Score Engine", icon: Zap, desc: "Real-time analysis of your resume formatting and keyword density." },
    { id: "jd", title: "Job Matching", icon: Target, desc: "Paste any JD to see a match percentage and missing keywords." },
    { id: "bullet", title: "Bullet Optimizer", icon: Sparkles, desc: "Transform boring tasks into high-impact professional achievements." },
    { id: "cover", title: "Cover Letter Gen", icon: FileText, desc: "Generate role-specific cover letters that match your profile." },
    { id: "tracker", title: "App Tracker", icon: Clock, desc: "Keep track of every job application, interview, and offer." },
    { id: "share", title: "Public Share", icon: Globe, desc: "Share your professional profile with a quick, secure web link." }
  ];

  const portfolioSteps = [
    {
      id: "gen-choose",
      title: "Select Template",
      description: "Choose from Minimal, Developer, or Professional templates to match your industry.",
      icon: Layout,
      color: "bg-indigo-500",
      details: ["SaaS Aesthetic", "Responsive Design", "Dark/Light Mode"]
    },
    {
      id: "gen-config",
      title: "Configure Deployment",
      description: "Add your Vercel API Token and Project Name to prepare for a live launch.",
      icon: Zap,
      color: "bg-amber-500",
      details: ["Vercel Integration", "Custom Domains", "One-click Deploy"]
    },
    {
      id: "gen-preview",
      title: "Preview & Source",
      description: "Review your live portfolio and download the JSON source code for manual hosting.",
      icon: Eye,
      color: "bg-purple-500",
      details: ["Live Preview", "JSON Export", "Full Ownership"]
    }
  ];

  const roleGuides = [
    {
      role: "Employees",
      icon: Trophy,
      title: "Level Up Your Career",
      guide: "Use the 'Professional' template to showcase your impact. Focus on metrics and leadership. Deploy your portfolio to a custom domain to show technical maturity."
    },
    {
      role: "Recruiters",
      icon: Eye,
      title: "Spot Talent Faster",
      guide: "Use the 'Recruiter View' toggle to see a condensed, high-impact version of any resume. Perfect for quick scanning and decision making."
    },
    {
      role: "Students",
      icon: Star,
      title: "Land Your First Role",
      guide: "Use the 'Developer' template to highlight your GitHub projects. The clean layout makes even early-career experience look professional and polished."
    }
  ];

  const plans = [
    {
      id: "portfolio_starter",
      name: "Portfolio Starter",
      price: "₹299",
      morphs: "2 Portfolios",
      icon: Star,
      color: "text-blue-500",
      bg: "bg-blue-50",
      desc: "Perfect for freshers"
    },
    {
      id: "portfolio_pro",
      name: "Portfolio Pro",
      price: "₹999",
      morphs: "5 Portfolios",
      icon: Trophy,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      desc: "Best for professionals",
      popular: true
    },
    {
      id: "combo_pack",
      name: "Master Combo",
      price: "₹1499",
      morphs: "15 Morphs + 10 Portfolios",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-50",
      desc: "Morph Engine + Portfolio Gen"
    }
  ];

  return (
    <div className="relative min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] selection:bg-indigo-500/30 font-sans transition-colors duration-300">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] right-[-10%] w-[600px] h-[600px] bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-10%] w-[500px] h-[500px] bg-purple-50/50 dark:bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-32">
        {/* Hero Section */}
        <div className="text-center mb-24 md:mb-40">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-10 shadow-sm"
          >
            <BookOpen className="w-4 h-4" />
            Central Knowledge Hub
          </motion.div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-[var(--text-primary)] tracking-tighter mb-8 md:mb-10 leading-[1.1] md:leading-[0.8]"
          >
            Master the <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Morph Engine.</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-base md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-medium mb-10 md:mb-16 leading-relaxed px-4"
          >
            Your all-in-one guide to professional transformation. Explore how we combine AI precision with high-fidelity design cloning.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6"
          >
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('restart-tour'))}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-8 md:px-10 py-5 md:py-6 bg-gray-950 dark:bg-indigo-600 text-white rounded-[24px] md:rounded-[32px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-900/20 group scale-100 active:scale-95"
            >
              <Rocket className="w-5 md:w-6 h-5 md:h-6 group-hover:scale-110 transition-transform" />
              Restart Interface Tour
            </button>
            <button
              onClick={() => document.getElementById('core-workflow')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-4 px-8 md:px-10 py-5 md:py-6 bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] rounded-[24px] md:rounded-[32px] text-[10px] md:text-xs font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all shadow-sm"
            >
              Explore Workflow
              <ArrowRight className="w-5 md:w-6 h-5 md:h-6" />
            </button>
          </motion.div>
        </div>

        {/* New UI Tour Section - Bento Grid */}
        <div className="mb-24 md:mb-48 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12">
          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 md:p-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[56px] shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 relative overflow-hidden group transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 relative z-10 shadow-2xl shadow-indigo-100 dark:shadow-none group-hover:scale-110 transition-transform">
              <Layout className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-3 md:mb-4 tracking-tight leading-none">Global Header</h3>
              <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium mb-6 md:mb-8 leading-relaxed">Branding and account identity are anchored at the top for surgical access to profile settings and usage metrics.</p>
              <div className="flex flex-col gap-3 md:gap-4">
                <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Persistent Branding</span>
                <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Account Integration</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 md:p-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[56px] shadow-sm hover:shadow-2xl hover:shadow-purple-100/50 dark:hover:shadow-purple-900/20 relative overflow-hidden group transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-purple-50 dark:bg-purple-900/20 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-purple-600 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 relative z-10 shadow-2xl shadow-purple-100 dark:shadow-none group-hover:scale-110 transition-transform">
              <Layers className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
            <div className="relative z-10">
              <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-3 md:mb-4 tracking-tight leading-none">Navigation Stack</h3>
              <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium mb-6 md:mb-8 leading-relaxed">Switch tools instantly via the floating bar. Designed to stay out of your way while keeping every tool one click away.</p>
              <div className="flex flex-col gap-3 md:gap-4">
                <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Fast Switching</span>
                <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-purple-500 dark:text-purple-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Mobile Scrollable</span>
              </div>
            </div>
          </motion.div>

          <motion.div 
            whileHover={{ y: -8 }}
            className="p-8 md:p-12 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[56px] shadow-sm hover:shadow-2xl hover:shadow-amber-100/50 dark:hover:shadow-amber-900/20 relative overflow-hidden group transition-all duration-500"
          >
            <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-amber-50 dark:bg-amber-900/20 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 group-hover:scale-150 transition-transform duration-700" />
            <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-600 rounded-2xl md:rounded-3xl flex items-center justify-center mb-8 md:mb-10 relative z-10 shadow-2xl shadow-amber-100 dark:shadow-none group-hover:scale-110 transition-transform">
              <Star className="w-6 md:w-8 h-6 md:h-8 text-white" />
            </div>
          <div className="relative z-10">
            <h3 className="text-xl md:text-2xl font-black text-[var(--text-primary)] mb-3 md:mb-4 tracking-tight leading-none">Usage Progress</h3>
            <p className="text-[var(--text-secondary)] text-sm md:text-base font-medium mb-6 md:mb-8 leading-relaxed">Watch your user level grow! The progress ring around your avatar tracks your Morph Engine usage in real-time.</p>
            <div className="flex flex-col gap-3 md:gap-4">
              <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Live Progress Ring</span>
              <span className="flex items-center gap-3 text-[9px] md:text-[10px] font-black text-amber-500 dark:text-amber-400 uppercase tracking-widest"><CheckCircle2 className="w-4 h-4" /> Tier Achievement</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Steps Grid */}
      <div id="core-workflow" className="scroll-mt-32 mb-32 md:mb-56">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-tight">The Engineering <br /><span className="text-indigo-600">Workflow.</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16">
          {steps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 md:p-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[64px] shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 dark:hover:shadow-indigo-900/20 transition-all group relative overflow-hidden"
            >
               <div className="absolute top-0 right-0 w-24 md:w-32 h-24 md:h-32 bg-[var(--bg-secondary)] rounded-bl-[60px] md:rounded-bl-[100px] -mr-6 md:-mr-8 -mt-6 md:-mt-8 pointer-events-none transition-transform group-hover:scale-110" />
              <div className={`w-12 h-12 md:w-16 md:h-16 ${step.color} rounded-xl md:rounded-[28px] flex items-center justify-center shadow-2xl shadow-indigo-100 dark:shadow-none mb-8 md:mb-10 group-hover:scale-110 transition-transform relative z-10`}>
                <step.icon className="text-white w-6 md:w-8 h-6 md:h-8" />
              </div>
              <div className="space-y-6 md:space-y-8 relative z-10">
                <div className="flex items-center gap-4 md:gap-6">
                  <span className="text-4xl md:text-7xl font-black text-indigo-50 dark:text-indigo-900/50 leading-none">0{index + 1}</span>
                  <h2 className="text-2xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight">{step.title}</h2>
                </div>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed text-sm md:text-xl">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3 pt-6 border-t border-[var(--border-color)]">
                  {step.details.map((detail) => (
                    <div key={detail} className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2 md:gap-3">
                      <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4 text-green-500" />
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Portfolio Generation Steps */}
      <div className="mb-24 md:mb-56 bg-gray-950 rounded-[40px] md:rounded-[80px] p-8 md:p-24 relative overflow-hidden border border-white/5 shadow-2xl">
        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-600/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
        
        <div className="relative z-10 text-center mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-6 py-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-8 md:mb-10"
          >
            <Rocket className="w-4 h-4 md:w-5 md:h-5" />
            Precision Deployment
          </motion.div>
          <h2 className="text-3xl md:text-8xl font-black text-white tracking-tighter mb-8 md:mb-10 leading-tight md:leading-none">Build Your <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-purple-500 to-pink-500">Digital Identity.</span></h2>
          <p className="text-gray-400 font-medium max-w-2xl mx-auto text-base md:text-2xl leading-relaxed px-4">
            Transform your static narrative into a high-performance, SaaS-style portfolio in three architectural phases.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 relative z-10">
          {portfolioSteps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 md:p-12 bg-white/[0.03] border border-white/10 rounded-[40px] md:rounded-[56px] backdrop-blur-3xl hover:bg-white/[0.06] transition-all group"
            >
              <div className={`w-12 h-12 md:w-16 md:h-16 ${step.color} rounded-2xl md:rounded-[28px] flex items-center justify-center shadow-2xl mb-8 md:mb-10 group-hover:scale-110 transition-transform`}>
                <step.icon className="text-white w-6 md:w-8 h-6 md:h-8" />
              </div>
              <div className="space-y-4 md:space-y-6">
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">{step.title}</h3>
                <p className="text-gray-400 font-medium leading-relaxed text-sm md:text-lg">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-2 md:gap-3 pt-6 border-t border-white/5">
                  {step.details.map((detail) => (
                    <div key={detail} className="px-3 md:px-4 py-1.5 md:py-2 bg-white/5 border border-white/10 rounded-lg md:rounded-xl text-[8px] md:text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2 md:gap-3">
                      <CheckCircle2 className="w-3 md:w-4 h-3 md:h-4 text-purple-400" />
                      {detail}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Role Guides */}
      <div className="mb-24 md:mb-56 px-4">
        <div className="text-center mb-16 md:mb-24">
          <h2 className="text-3xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-tight">Architected for <br /><span className="text-indigo-600">Every Professional.</span></h2>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto text-base md:text-2xl leading-relaxed mt-6 md:mt-8 px-4">Specialized strategic guides to navigate every unique career transition phase.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {roleGuides.map((guide, index) => (
            <motion.div
              key={guide.role}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-8 md:p-14 bg-indigo-950 dark:bg-gray-900 text-white rounded-[40px] md:rounded-[64px] relative overflow-hidden group flex flex-col h-full shadow-2xl shadow-indigo-900/20 border border-white/5"
            >
              <div className="absolute top-0 right-0 w-32 md:w-40 h-32 md:h-40 bg-white/5 rounded-full -mr-16 md:-mr-20 -mt-16 md:-mt-20 group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
              <guide.icon className="w-10 h-10 md:w-14 md:h-14 text-indigo-400 mb-8 md:mb-12 group-hover:rotate-12 transition-transform shrink-0" />
              <div className="flex-grow space-y-4 md:space-y-6">
                <h3 className="text-[9px] md:text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em]">{guide.role}</h3>
                <h4 className="text-2xl md:text-4xl font-black tracking-tight leading-tight">{guide.title}</h4>
                <p className="text-indigo-100/70 font-medium leading-relaxed text-sm md:text-lg">
                  {guide.guide}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Pricing Section - High Resolution Refined */}
      <div className="mb-24 md:mb-56 px-4">
        <div className="text-center mb-16 md:mb-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-5 md:px-6 py-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-100/50 dark:border-amber-800 rounded-full text-[9px] md:text-xs font-black uppercase tracking-[0.2em] mb-8 md:mb-10 shadow-sm"
          >
            <Zap className="w-4 h-4 md:w-5 md:h-5 fill-amber-600 dark:fill-amber-400" />
            Strategic Investment
          </motion.div>
          <h2 className="text-4xl md:text-8xl font-black text-[var(--text-primary)] tracking-tighter mb-8 md:mb-10 leading-tight md:leading-none">Simple, Modular <span className="text-indigo-600">Pricing.</span></h2>
          <p className="text-base md:text-2xl text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed px-4">
            Choose the strategic plan that fits your career velocity. Precision AI processing and executive templates included.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-8 md:p-16 rounded-[40px] md:rounded-[64px] border-2 transition-all relative overflow-hidden group flex flex-col h-full",
                plan.popular 
                  ? "border-indigo-600 bg-indigo-50/20 dark:bg-indigo-900/10 shadow-[0_40px_80px_-20px_rgba(79,70,229,0.2)]" 
                  : "border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm"
              )}
            >
              {plan.popular && (
                <div className="absolute top-6 md:top-10 right-6 md:right-10 px-4 md:px-5 py-1.5 md:py-2 bg-indigo-600 text-white text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg">
                  Strategic Choice
                </div>
              )}
              <div className={cn("w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center mb-8 md:mb-12 shadow-lg shrink-0 transition-colors", plan.bg, "dark:bg-indigo-900/40")}>
                <plan.icon className={cn("w-6 md:w-8 h-6 md:h-8", plan.color)} />
              </div>
              <div className="flex-grow space-y-3 md:space-y-4 mb-8 md:mb-12">
                <h3 className="text-2xl md:text-4xl font-black text-[var(--text-primary)] tracking-tight leading-tight md:leading-none">{plan.name}</h3>
                <p className="text-[var(--text-secondary)] text-sm md:text-lg font-medium leading-relaxed">{plan.desc}</p>
              </div>
              
              <div className="mb-8 md:mb-12">
                <div className="flex items-baseline gap-2 md:gap-3">
                  <span className="text-4xl md:text-6xl font-black text-[var(--text-primary)] tracking-tighter">{plan.price}</span>
                  <span className="text-[10px] md:text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest leading-none">/ {plan.morphs}</span>
                </div>
              </div>

              <div className="space-y-4 md:space-y-5 pt-8 md:pt-12 border-t border-[var(--border-color)]">
                <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest leading-tight">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-green-500 shrink-0" />
                  Premium Templates
                </div>
                <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-xs font-black text-[var(--text-secondary)] uppercase tracking-widest leading-tight">
                  <CheckCircle2 className="w-4 md:w-5 h-4 md:h-5 text-green-500 shrink-0" />
                  Priority Pipeline
                </div>
                {plan.name === "Unlimited Access" && (
                  <div className="flex items-center gap-3 md:gap-4 text-[9px] md:text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                    <Clock className="w-4 md:w-5 h-4 md:h-5 shrink-0" />
                    30 Days Validity
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Grid Polished */}
      <div className="mx-4 p-8 md:p-24 bg-gray-950 rounded-[40px] md:rounded-[80px] relative overflow-hidden border border-white/5 shadow-2xl mb-24 md:mb-56">
        <div className="absolute top-0 right-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-indigo-600/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] md:w-[500px] h-[400px] md:h-[500px] bg-purple-600/10 rounded-full blur-[100px] md:blur-[140px] pointer-events-none" />
        
        <div className="relative z-10 text-center mb-16 md:mb-32">
          <h2 className="text-3xl md:text-7xl font-black text-white tracking-tighter leading-tight md:leading-none mb-8 md:mb-10">Architected for <br /><span className="text-indigo-400">Total Dominance.</span></h2>
          <p className="text-gray-400 font-medium max-w-2xl mx-auto text-base md:text-2xl leading-relaxed px-4">
            Our platform merges executive career strategy with bleeding-edge AI to guarantee surgical precision in every application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 relative z-10">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className="p-8 md:p-10 bg-white/[0.03] backdrop-blur-3xl border border-white/10 rounded-[32px] md:rounded-[48px] hover:bg-white/[0.06] transition-all group"
            >
              <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/10 rounded-2xl md:rounded-[28px] flex items-center justify-center mb-8 md:mb-10 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 md:w-8 h-6 md:h-8 text-indigo-400" />
              </div>
              <h3 className="text-xl md:text-2xl font-black text-white mb-3 md:mb-4 tracking-tight leading-tight md:leading-none">{feature.title}</h3>
              <p className="text-gray-400 text-sm md:text-lg font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Activation Protocol */}
      <div className="mx-4 p-8 md:p-24 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[80px] shadow-2xl shadow-indigo-100/20 dark:shadow-none mb-24 md:mb-56 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        <div className="max-w-4xl mx-auto text-center space-y-8 md:space-y-12">
          <div className="w-16 h-16 md:w-24 md:h-24 bg-indigo-600 rounded-2xl md:rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 dark:shadow-none transition-transform hover:scale-110">
            <MessageCircle className="w-8 h-8 md:w-12 md:h-12 text-white fill-white" />
          </div>
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-3xl md:text-7xl font-black text-[var(--text-primary)] tracking-tighter leading-tight md:leading-none">Manual Account <br /><span className="text-indigo-600">Verification.</span></h2>
            <p className="text-base md:text-2xl text-[var(--text-secondary)] font-medium leading-relaxed max-w-2xl mx-auto px-4">
              We bridge technology with a human touch. Every premium account is manually verified by our team to guarantee flawless engine configuration.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-left pt-8 md:pt-12">
            <div className="p-8 md:p-12 bg-[var(--bg-secondary)] rounded-[32px] md:rounded-[48px] border border-[var(--border-color)] hover:border-indigo-200 transition-colors group">
              <div className="text-4xl md:text-5xl font-black text-indigo-100 dark:text-indigo-900/30 mb-6 md:mb-8 group-hover:text-indigo-200 transition-colors">01</div>
              <h4 className="text-sm md:text-base font-black text-[var(--text-primary)] uppercase tracking-widest mb-3 md:mb-4 leading-tight">Config</h4>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em] leading-relaxed">Choose your strategic plan from the dashboard matrix.</p>
            </div>
            <div className="p-8 md:p-12 bg-[var(--bg-secondary)] rounded-[32px] md:rounded-[48px] border border-[var(--border-color)] hover:border-indigo-200 transition-colors group">
              <div className="text-4xl md:text-5xl font-black text-indigo-100 dark:text-indigo-900/30 mb-6 md:mb-8 group-hover:text-indigo-200 transition-colors">02</div>
              <h4 className="text-sm md:text-base font-black text-[var(--text-primary)] uppercase tracking-widest mb-3 md:mb-4 leading-tight">Sync</h4>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em] leading-relaxed">Secure activation via our direct WhatsApp support desk.</p>
            </div>
            <div className="p-8 md:p-12 bg-[var(--bg-secondary)] rounded-[32px] md:rounded-[48px] border border-[var(--border-color)] hover:border-indigo-200 transition-colors group">
              <div className="text-4xl md:text-5xl font-black text-indigo-100 dark:text-indigo-900/30 mb-6 md:mb-8 group-hover:text-indigo-200 transition-colors">03</div>
              <h4 className="text-sm md:text-base font-black text-[var(--text-primary)] uppercase tracking-widest mb-3 md:mb-4 leading-tight">Launch</h4>
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.15em] leading-relaxed">Instant upgrade with personalized boarding experience.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Call to Action */}
      <div className="relative z-10 px-4 pb-24">
        <div className="px-6 md:px-12 py-16 md:py-48 bg-gray-950 rounded-[40px] md:rounded-[100px] text-center relative overflow-hidden border border-white/5 shadow-[0_60px_120px_-30px_rgba(79,70,229,0.3)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.25),transparent_70%)]" />
          <div className="relative z-10 max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-9xl font-black text-white tracking-tighter mb-8 md:mb-12 leading-tight md:leading-[0.85]">Ready to <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-purple-400">Transform?</span></h2>
            <p className="text-gray-400 text-base md:text-2xl font-medium mb-12 md:mb-24 leading-relaxed px-4">
              Empower your professional narrative with surgical precision. Join thousands of world-class leaders today.
            </p>
            <button className="w-full sm:w-auto px-10 md:px-12 py-6 md:py-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-[24px] md:rounded-[40px] font-black text-lg md:text-2xl shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 md:gap-6 mx-auto group">
              Get Started Now
              <ArrowRight className="w-6 md:w-10 h-6 md:h-10 group-hover:translate-x-3 transition-transform" />
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}
