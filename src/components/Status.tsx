import React from 'react';
import { motion } from 'motion/react';
import { Activity, CheckCircle2, AlertCircle, Clock, Server, Database, Brain, Globe, RefreshCw } from 'lucide-react';

export default function Status() {
  const services = [
    { name: 'Morph Engine (Core)', status: 'Operational', icon: RefreshCw, delay: '12ms' },
    { name: 'AI Generation API', status: 'Operational', icon: Brain, delay: '450ms' },
    { name: 'Firestore Database', status: 'Operational', icon: Database, delay: '8ms' },
    { name: 'Image Storage (CDN)', status: 'Operational', icon: Globe, delay: '15ms' },
    { name: 'Authentication Service', status: 'Operational', icon: Server, delay: '22ms' },
    { name: 'Portfolio Hosting', status: 'Operational', icon: Activity, delay: '10ms' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-full mb-8">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">All Systems Operational</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            System <span className="saas-gradient-text">Status</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed">
            Real-time monitoring of all ResumeMorph services and infrastructure. We maintain a 99.9% uptime commitment.
          </p>
        </motion.div>

        {/* Uptime Overview */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 md:p-12 mb-12 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[var(--text-tertiary)]" />
              <h3 className="text-xl font-black text-[var(--text-primary)]">Last 90 Days</h3>
            </div>
            <span className="text-sm font-black text-emerald-600">99.98% Uptime</span>
          </div>
          
          <div className="flex gap-1 h-12 mb-4">
            {Array.from({ length: 90 }).map((_, i) => (
              <div 
                key={i} 
                className={cn(
                  "flex-1 rounded-full transition-all hover:scale-y-125 cursor-pointer",
                  i === 45 ? "bg-amber-400" : "bg-emerald-500"
                )}
                title={`June ${90 - i}, 2026: ${i === 45 ? 'Partial Outage (12min)' : 'Operational'}`}
              />
            ))}
          </div>
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
            <span>90 days ago</span>
            <span>Today</span>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-4 mb-16">
          {services.map((service, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[24px] hover:border-indigo-400 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <service.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[var(--text-primary)]">{service.name}</h4>
                  <p className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mt-1">Latency: {service.delay}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-2xl text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-bold">{service.status}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Incident History */}
        <div className="space-y-8">
          <h3 className="text-2xl font-black text-[var(--text-primary)] mb-8 flex items-center gap-3">
            <AlertCircle className="w-7 h-7 text-amber-500" />
            Recent Incidents
          </h3>
          {[
            { date: 'June 12, 2026', title: 'Scheduled Maintenance', status: 'Completed', desc: 'Routine infrastructure upgrades and database optimization.' },
            { date: 'May 28, 2026', title: 'API Latency Spikes', status: 'Resolved', desc: 'Identified and resolved performance bottleneck in AI generation service.' },
          ].map((incident, i) => (
            <div key={i} className="relative pl-8 border-l-2 border-[var(--border-color)]">
              <div className="absolute top-0 left-0 -translate-x-[9px] w-4 h-4 rounded-full bg-[var(--bg-primary)] border-2 border-indigo-600" />
              <div className="mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">{incident.date}</span>
                <div className="flex items-center gap-3 mt-1">
                  <h4 className="text-xl font-black text-[var(--text-primary)]">{incident.title}</h4>
                  <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">{incident.status}</span>
                </div>
              </div>
              <p className="text-[var(--text-secondary)] font-medium leading-relaxed">
                {incident.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-20 p-12 bg-slate-900 rounded-[48px] text-white text-center">
          <h3 className="text-2xl font-black mb-4">Want status alerts?</h3>
          <p className="text-slate-400 font-medium mb-8 leading-relaxed max-w-lg mx-auto">
            Subscribe to our system status updates to receive real-time notifications about outages and maintenance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
              Subscribe
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
