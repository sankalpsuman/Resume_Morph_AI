import React from 'react';
import { motion } from 'motion/react';
import { Code, Terminal, Key, Box, Globe, Copy, Check, Lock, Database } from 'lucide-react';

export default function API() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText('https://api.resumemorph.com/v1/generate');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    { method: 'POST', path: '/v1/resumes', desc: 'Generate a new resume from JSON data.' },
    { method: 'GET', path: '/v1/resumes/:id', desc: 'Retrieve a generated resume by ID.' },
    { method: 'POST', path: '/v1/analyze', desc: 'Run AI diagnostic scan on a document.' },
    { method: 'GET', path: '/v1/templates', desc: 'List all available Morph templates.' }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-full mb-6">
            <Terminal className="w-4 h-4 text-indigo-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Developer Platform</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Morph <span className="saas-gradient-text">Public API</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto font-medium leading-relaxed">
            Integrate the world's most advanced career AI into your own applications. Fast, secure, and developer-first.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start mb-32">
          {/* Quick Start */}
          <div className="space-y-10">
            <div>
              <h2 className="text-3xl font-black text-[var(--text-primary)] mb-6">Quick Start</h2>
              <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed mb-8">
                Get up and running in minutes. Our RESTful API follows standard HTTP protocols and returns JSON-encoded responses.
              </p>
              <div className="space-y-6">
                {[
                  { icon: Key, title: 'Authentication', desc: 'All requests use Bearer Token authentication via the Authorization header.' },
                  { icon: Box, title: 'JSON Only', desc: 'Send and receive data in standard JSON format for maximum compatibility.' },
                  { icon: Globe, title: 'CORS Enabled', desc: 'Built-in support for cross-origin requests from web applications.' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xl font-black text-[var(--text-primary)] mb-1">{item.title}</p>
                      <p className="text-[var(--text-secondary)] font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8">
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-6">API Endpoints</h3>
              <div className="space-y-4">
                {endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-2xl group hover:border-indigo-400 transition-all">
                    <div className="flex items-center gap-4">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                        ep.method === 'POST' ? "bg-emerald-50 text-emerald-600" : "bg-indigo-50 text-indigo-600"
                      )}>{ep.method}</span>
                      <code className="text-sm font-mono font-bold text-[var(--text-primary)]">{ep.path}</code>
                    </div>
                    <div className="w-8 h-8 rounded-full border border-[var(--border-color)] flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all opacity-0 group-hover:opacity-100">
                      <Copy className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Code Example */}
          <div className="sticky top-32">
            <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-2xl">
              <div className="px-8 py-4 bg-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest">resumemorph.js</span>
              </div>
              <div className="p-8 md:p-10">
                <pre className="text-sm font-mono text-indigo-300 leading-relaxed overflow-x-auto">
{`// Generate a new resume
const response = await fetch('https://api.resumemorph.com/v1/resumes', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    template: 'cosmic-slate',
    data: {
      name: 'Jane Doe',
      experience: [...]
    }
  })
});

const result = await response.json();
console.log('Morph ID:', result.id);`}
                </pre>
              </div>
              <div className="px-8 py-6 bg-slate-800/50 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-400">Node.js / cURL / Python supported</span>
                </div>
                <button 
                  onClick={handleCopy}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Endpoint'}
                </button>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center">
                <Lock className="w-8 h-8 text-emerald-500 mx-auto mb-4" />
                <p className="text-sm font-black text-emerald-600 uppercase tracking-widest">Secure</p>
                <p className="text-[10px] font-bold text-emerald-800/60 mt-1">SSL/TLS 1.3</p>
              </div>
              <div className="p-6 bg-indigo-500/10 border border-indigo-500/20 rounded-3xl text-center">
                <Database className="w-8 h-8 text-indigo-500 mx-auto mb-4" />
                <p className="text-sm font-black text-indigo-600 uppercase tracking-widest">Fast</p>
                <p className="text-[10px] font-bold text-indigo-800/60 mt-1">200ms avg.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing/Rate Limits */}
        <div className="p-12 md:p-20 bg-slate-900 rounded-[56px] text-white text-center">
          <h2 className="text-4xl font-black mb-8">Ready to scale?</h2>
          <p className="text-lg text-slate-400 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Start with 1,000 requests/month for free. Upgrade to our Developer or Enterprise plans for higher throughput and dedicated support.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <button className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all shadow-xl">
              Get API Key
            </button>
            <button className="px-10 py-5 border-2 border-white/20 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-white/5 transition-all">
              View Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
