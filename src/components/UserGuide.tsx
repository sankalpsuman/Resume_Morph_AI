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
  Clock
} from 'lucide-react';

export default function UserGuide() {
  const steps = [
    {
      id: "upload",
      title: "Upload Your Resume",
      description: "Start by uploading your current resume in PDF or DOCX format. Our engine will analyze the structure and content.",
      icon: Upload,
      color: "bg-blue-500",
      details: ["Supports PDF, DOCX, TXT", "Automatic text extraction", "Privacy guaranteed"]
    },
    {
      id: "choose",
      title: "Choose Your Morph",
      description: "Select from our premium templates or describe how you want your resume to look. Our AI handles the heavy lifting.",
      icon: Sparkles,
      color: "bg-purple-500",
      details: ["Cloned visual styles", "ATS-friendly layouts", "Custom descriptions"]
    },
    {
      id: "review",
      title: "Review & Refine",
      description: "Get a real-time preview of your morphed resume. You can make adjustments or try different styles instantly.",
      icon: Layout,
      color: "bg-indigo-500",
      details: ["Side-by-side preview", "Instant style switching", "Real-time updates"]
    },
    {
      id: "download",
      title: "Download & Apply",
      description: "Once satisfied, download your perfectly formatted resume in high-quality HTML or PDF format.",
      icon: Download,
      color: "bg-green-500",
      details: ["High-fidelity PDF", "Clean HTML export", "Word compatible"]
    }
  ];

  const features = [
    { id: "analysis", title: "AI-Powered Analysis", icon: Zap, desc: "Deep learning models analyze your resume structure." },
    { id: "templates", title: "Premium Templates", icon: Star, desc: "Hand-crafted designs that pass any ATS system." },
    { id: "security", title: "Secure Data Handling", icon: Shield, desc: "Your data is encrypted and never shared with third parties." },
    { id: "previews", title: "Instant Previews", icon: Eye, desc: "See changes as they happen with our lightning-fast engine." },
    { id: "history", title: "History Tracking", icon: History, desc: "Access your previous morphs anytime from your dashboard." },
    { id: "export", title: "Export to Multiple Formats", icon: FileText, desc: "Download in PDF, HTML, or DOCX for maximum compatibility." }
  ];

  const plans = [
    {
      id: "starter",
      name: "Starter Pack",
      price: "₹39",
      morphs: "5 Morphs",
      icon: Star,
      color: "text-blue-500",
      bg: "bg-blue-50",
      desc: "Perfect for quick updates"
    },
    {
      id: "pro",
      name: "Pro Pack",
      price: "₹79",
      morphs: "10 Morphs",
      icon: Trophy,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
      desc: "Best for active job seekers",
      popular: true
    },
    {
      id: "unlimited",
      name: "Unlimited Access",
      price: "₹499",
      morphs: "Unlimited",
      icon: Sparkles,
      color: "text-purple-500",
      bg: "bg-purple-50",
      desc: "30 days of total freedom"
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
          Everything you need to know to transform your professional identity in seconds. Follow our step-by-step guide to get started.
        </motion.p>
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
