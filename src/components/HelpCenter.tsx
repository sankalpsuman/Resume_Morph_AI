import React from 'react';
import { motion } from 'motion/react';
import { Search, Book, MessageCircle, FileText, Zap, ChevronRight, HelpCircle } from 'lucide-react';

export default function HelpCenter() {
  const categories = [
    { title: 'Getting Started', count: 12, icon: Zap, color: 'bg-amber-50 text-amber-600' },
    { title: 'Resume Builder', count: 24, icon: FileText, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'AI Features', count: 18, icon: MessageCircle, color: 'bg-purple-50 text-purple-600' },
    { title: 'Account & Billing', count: 15, icon: Book, color: 'bg-emerald-50 text-emerald-600' },
  ];

  const faqs = [
    { q: "How does the AI Resume Builder work?", a: "Our AI analyzes your experience and automatically maps it to high-performing industry templates using advanced cognitive patterns." },
    { q: "Can I use ResumeMorph for free?", a: "Yes! We offer a generous free tier that includes access to our core Morph Engine and basic templates." },
    { q: "Is my data secure?", a: "Absolutely. We use enterprise-grade encryption and automatically purge unsaved data after 5 days." },
    { q: "How do I upgrade to Pro?", a: "You can upgrade anytime via the 'Upgrade' button in your account dashboard to unlock advanced features." }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12">
      <div className="max-w-7xl mx-auto px-4">
        {/* Hero Section */}
        <div className="bg-slate-900 rounded-[48px] p-12 md:p-24 text-white relative overflow-hidden mb-16">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          <div className="relative z-10 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight">How can we <span className="text-indigo-400">help you?</span></h1>
            <div className="relative mb-8">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search for guides, features, or troubleshooting..." 
                className="w-full pl-16 pr-8 py-6 bg-white/5 border border-white/10 rounded-3xl text-lg font-medium outline-none focus:ring-4 focus:ring-indigo-500/20 transition-all placeholder:text-slate-500"
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm font-bold text-slate-400">
              <span>Popular:</span>
              {['ATS Scoring', 'Subscription', 'Export PDF', 'LinkedIn Import'].map((tag, i) => (
                <button key={i} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {categories.map((cat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] hover:border-indigo-400 transition-all cursor-pointer"
            >
              <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110", cat.color)}>
                <cat.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{cat.title}</h3>
              <p className="text-sm text-[var(--text-tertiary)] font-bold uppercase tracking-widest">{cat.count} Articles</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-20">
          {/* FAQ Section */}
          <div className="lg:col-span-2 space-y-8">
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3">
              <HelpCircle className="w-8 h-8 text-indigo-600" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="p-6 rounded-[24px] bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-indigo-400 transition-all group cursor-pointer">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-lg font-black text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">{faq.q}</h4>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="mt-4 text-[var(--text-secondary)] font-medium leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Support Sidebar */}
          <div className="space-y-8">
            <div className="p-8 bg-indigo-600 rounded-[32px] text-white">
              <h3 className="text-2xl font-black mb-4">Still need help?</h3>
              <p className="text-indigo-100 font-medium mb-8 leading-relaxed">
                Our support team is available 24/7 to help you with any technical or account issues.
              </p>
              <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-50 transition-all mb-4">
                Chat with Support
              </button>
              <button className="w-full py-4 border border-indigo-400 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                Email Us
              </button>
            </div>

            <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px]">
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Support Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-secondary)]">Average Response Time</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">~2 Hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-secondary)]">Customer Satisfaction</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">98.5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[var(--text-secondary)]">Support Language</span>
                  <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">English</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
