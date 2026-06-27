import React from 'react';
import { motion } from 'motion/react';
import { Search, Brain, BarChart3, Target, CheckCircle2, AlertCircle, FileText, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Analyzer({ user, onLogin }: { user: any, onLogin: () => void }) {
  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-12">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-full mb-6">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Cognitive Analyzer</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            AI-Powered <span className="saas-gradient-text">Resume Diagnostic</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
            Upload your resume and get a comprehensive score based on ATS compatibility, keyword density, and professional impact.
          </p>
        </motion.div>

        {!user ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-12 text-center max-w-2xl mx-auto shadow-2xl"
          >
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-[24px] flex items-center justify-center mx-auto mb-8">
              <Search className="w-10 h-10 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-black text-[var(--text-primary)] mb-4">Start Your Analysis</h2>
            <p className="text-[var(--text-secondary)] mb-8 text-lg font-medium">Sign in to unlock deep insights into your resume performance and see how you stack up against industry benchmarks.</p>
            <button 
              onClick={onLogin}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-200 dark:shadow-none"
            >
              Sign In to Analyze
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Mock Analysis Dashboard */}
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-2xl font-black text-[var(--text-primary)]">Diagnostic Overview</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">Real-time scoring based on 50+ career metrics</p>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-xs font-bold">Ready to Scan</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                  {[
                    { label: 'ATS Score', value: '84', color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Keyword Match', value: '92%', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Impact Factor', value: '7.8', color: 'text-purple-600', bg: 'bg-purple-50' },
                  ].map((stat, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)] mb-2">{stat.label}</p>
                      <p className={cn("text-4xl font-black", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h4 className="text-lg font-black text-[var(--text-primary)]">Critical Insights</h4>
                  {[
                    { icon: Target, title: 'Role Alignment', desc: 'Your profile shows high alignment with Senior Software Engineering roles.', status: 'positive' },
                    { icon: AlertCircle, title: 'Quantifiable Results', desc: 'Add more metrics (%, $, time) to your experience bullet points.', status: 'warning' },
                    { icon: FileText, title: 'Formatting Scan', desc: 'Standard layout detected. Perfect for major ATS parsers like Workday.', status: 'positive' },
                  ].map((insight, i) => (
                    <div key={i} className="flex gap-4 p-5 rounded-2xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                        insight.status === 'positive' ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                      )}>
                        <insight.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-bold text-[var(--text-primary)]">{insight.title}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">{insight.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-black mb-4">Unlock Full Diagnostic</h3>
                  <p className="text-indigo-100 mb-6 font-medium max-w-lg leading-relaxed">
                    Our Pro analyzer scans against 2,000+ specific job descriptions to give you exact keyword recommendations and formatting fixes.
                  </p>
                  <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all">
                    Upgrade to Pro
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-sm">
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">Recent Analysis</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-[var(--border-color)] hover:bg-[var(--bg-primary)] transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[var(--text-primary)]">Resume_V{i}.pdf</p>
                          <p className="text-[10px] text-[var(--text-tertiary)] font-bold uppercase">Scanned 2 days ago</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-indigo-600">8{i}</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase">Score</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-6 py-4 border-2 border-dashed border-[var(--border-color)] rounded-2xl text-[var(--text-tertiary)] font-bold hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center justify-center gap-2 group">
                  <Zap className="w-4 h-4 group-hover:animate-pulse" />
                  New Scan
                </button>
              </div>

              <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 shadow-sm">
                <h3 className="text-xl font-black text-[var(--text-primary)] mb-4">Why Analyze?</h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6 font-medium">
                  75% of resumes are rejected by ATS before a human even sees them. Our analyzer ensures you're in the top 25%.
                </p>
                <div className="space-y-4">
                  {[
                    'Beat ATS algorithms',
                    'Optimize keyword density',
                    'Check visual hierarchy',
                    'Identify skill gaps'
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                      </div>
                      <span className="text-sm font-bold text-[var(--text-secondary)]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
