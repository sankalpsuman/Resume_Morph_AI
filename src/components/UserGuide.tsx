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
    <div className="max-w-6xl mx-auto px-4 py-12 md:py-20">
      {/* Hero Section */}
      <div className="text-center mb-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
        >
          <BookOpen className="w-4 h-4" />
          User Guide & Documentation
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-6xl font-black text-gray-900 tracking-tight mb-6"
        >
          Master the <span className="text-indigo-600">Morph Engine</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-gray-500 max-w-2xl mx-auto font-medium"
        >
          Explore the new <strong>Unified Interface</strong>. We've consolidated branding, accounts, and navigation to give you a seamless studio experience.
        </motion.p>
      </div>

      {/* New UI Tour Section */}
      <div className="mb-40 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="p-8 bg-white border border-indigo-50 rounded-[40px] shadow-sm">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-100">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3">Global Header</h3>
          <p className="text-gray-500 text-sm font-medium mb-4">Your branding and account identity are now anchored at the very top, providing quick access to profile settings and usage stats.</p>
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Persistent Branding</span>
            <span className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Account Integration</span>
          </div>
        </div>

        <div className="p-8 bg-white border border-indigo-50 rounded-[40px] shadow-sm">
          <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-purple-100">
            <Layers className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3">Navigation Stack</h3>
          <p className="text-gray-500 text-sm font-medium mb-4">Switch between tools instantly using the floating navigation bar. It's designed to stay out of your way while keeping every tool one click away.</p>
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Fast Switching</span>
            <span className="flex items-center gap-2 text-[10px] font-black text-purple-400 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Mobile Scrollable</span>
          </div>
        </div>

        <div className="p-8 bg-white border border-indigo-50 rounded-[40px] shadow-sm">
          <div className="w-12 h-12 bg-amber-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-amber-100">
            <Star className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-3">Experience Progress</h3>
          <p className="text-gray-500 text-sm font-medium mb-4">Watch your user level grow! The progress ring around your avatar tracks your Morph Engine usage in real-time.</p>
          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Live Progress Ring</span>
            <span className="flex items-center gap-2 text-[10px] font-black text-amber-500 uppercase tracking-widest"><CheckCircle2 className="w-3 h-3" /> Tier Achievement</span>
          </div>
        </div>
      </div>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-40">
        {steps.map((step, index) => (
          <motion.div 
            key={step.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-10 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all group"
          >
            <div className={`w-16 h-16 ${step.color} rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-100 mb-8 group-hover:scale-110 transition-transform`}>
              <step.icon className="text-white w-8 h-8" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-black text-gray-100">0{index + 1}</span>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h2>
              </div>
              <p className="text-gray-500 font-medium leading-relaxed">
                {step.description}
              </p>
              <div className="space-y-2 pt-4">
                {step.details.map((detail) => (
                  <div key={detail} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Portfolio Generation Steps */}
      <div className="mb-40">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Rocket className="w-4 h-4" />
            Portfolio Generation Guide
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">Build Your <span className="text-purple-600">Digital Home</span></h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">
            Transform your resume into a high-performance portfolio website in three simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {portfolioSteps.map((step, index) => (
            <motion.div 
              key={step.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-10 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all group"
            >
              <div className={`w-16 h-16 ${step.color} rounded-3xl flex items-center justify-center shadow-2xl shadow-purple-100 mb-8 group-hover:scale-110 transition-transform`}>
                <step.icon className="text-white w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{step.title}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {step.description}
                </p>
                <div className="space-y-2 pt-4">
                  {step.details.map((detail) => (
                    <div key={detail} className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
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
      <div className="mb-40">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">Guides for <span className="text-indigo-600">Every Role</span></h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {roleGuides.map((guide, index) => (
            <motion.div
              key={guide.role}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="p-10 bg-indigo-900 text-white rounded-[48px] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
              <guide.icon className="w-12 h-12 text-indigo-400 mb-8" />
              <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-2">{guide.role}</h3>
              <h4 className="text-2xl font-black mb-4 tracking-tight">{guide.title}</h4>
              <p className="text-indigo-100/70 font-medium leading-relaxed">
                {guide.guide}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Premium Plans Section */}
      <div className="mb-40">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-full text-xs font-black uppercase tracking-widest mb-6"
          >
            <Zap className="w-4 h-4 fill-amber-600" />
            Premium Access
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mb-6">Simple, Transparent <span className="text-indigo-600">Pricing</span></h2>
          <p className="text-gray-500 font-medium max-w-xl mx-auto">
            Choose the plan that fits your career goals. All premium plans include high-priority AI processing and expert support.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "p-10 rounded-[40px] border-2 transition-all relative overflow-hidden group",
                plan.popular ? "border-indigo-600 bg-indigo-50/30" : "border-gray-100 bg-white"
              )}
            >
              {plan.popular && (
                <div className="absolute top-6 right-6 px-3 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg", plan.bg)}>
                <plan.icon className={cn("w-7 h-7", plan.color)} />
              </div>
              <h3 className="text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-500 text-sm font-medium mb-8">{plan.desc}</p>
              
              <div className="space-y-4 mb-8">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-gray-900">{plan.price}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ {plan.morphs}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Premium Templates
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Priority Support
                </div>
                {plan.name === "Unlimited Access" && (
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    <Clock className="w-4 h-4 text-indigo-500" />
                    30 Days Validity
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="p-12 md:p-20 bg-gray-900 rounded-[64px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600 rounded-full -mr-48 -mt-48 blur-[120px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600 rounded-full -ml-48 -mb-48 blur-[120px] opacity-20" />
        
        <div className="relative z-10 text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-6">Powerful Features</h2>
          <p className="text-gray-400 font-medium max-w-xl mx-auto">
            Our platform is built with the latest AI technology to ensure your resume stands out from the crowd.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
          {features.map((feature) => (
            <div 
              key={feature.id}
              className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group"
            >
              <div className="w-12 h-12 bg-indigo-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manual Upgrade Instructions */}
      <div className="mt-40 p-12 md:p-20 bg-indigo-50 rounded-[64px] border border-indigo-100">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="w-20 h-20 bg-indigo-600 rounded-[28px] flex items-center justify-center mx-auto shadow-xl shadow-indigo-200">
            <MessageCircle className="w-10 h-10 text-white fill-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">Manual Upgrade Process</h2>
          <p className="text-lg text-gray-600 font-medium">
            Since we are in early access, we handle premium upgrades manually to ensure the best experience.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="p-6 bg-white rounded-3xl border border-indigo-100">
              <div className="text-2xl font-black text-indigo-600 mb-2">01</div>
              <p className="text-sm font-bold text-gray-700">Select your preferred plan from the upgrade modal.</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-indigo-100">
              <div className="text-2xl font-black text-indigo-600 mb-2">02</div>
              <p className="text-sm font-bold text-gray-700">Submit your request and click "Contact on WhatsApp".</p>
            </div>
            <div className="p-6 bg-white rounded-3xl border border-indigo-100">
              <div className="text-2xl font-black text-indigo-600 mb-2">03</div>
              <p className="text-sm font-bold text-gray-700">Admin will verify and activate your plan instantly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-40 text-center">
        <div className="inline-block p-1 rounded-[32px] bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-2xl shadow-indigo-200/50">
          <div className="bg-white rounded-[30px] px-12 py-16 md:px-24">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 mb-6">Ready to Morph?</h2>
            <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto">
              Join thousands of professionals who have transformed their careers with Resume Morph.
            </p>
            <button className="px-10 py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[24px] font-black text-lg shadow-2xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 mx-auto">
              Get Started Now
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
