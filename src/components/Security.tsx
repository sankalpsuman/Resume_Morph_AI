import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Key, EyeOff, Server, HardDrive, Cpu, CheckCircle2 } from 'lucide-react';

export default function Security() {
  const securityFeatures = [
    {
      title: "End-to-End Encryption",
      desc: "All your personal data is encrypted at rest and in transit using AES-256 and TLS 1.3 standards.",
      icon: Lock,
      status: "Active"
    },
    {
      title: "Secure Authentication",
      desc: "Leveraging Firebase Authentication and industry-standard OAuth 2.0 protocols for zero-trust access.",
      icon: Key,
      status: "Active"
    },
    {
      title: "Automated Data Deletion",
      desc: "Resumes are automatically purged from our system after 5 days of inactivity unless saved.",
      icon: EyeOff,
      status: "Active"
    },
    {
      title: "Infrastructure Security",
      desc: "Hosted on Google Cloud Platform with VPC service controls and strict firewall rules.",
      icon: Server,
      status: "Active"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-800 rounded-full mb-6">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Enterprise Grade Security</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Our Security <span className="saas-gradient-text">Protocol</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto font-medium leading-relaxed">
            We treat your career data with the same intensity as financial information. Privacy and security are baked into every line of code.
          </p>
        </motion.div>

        {/* Security Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-32">
          {securityFeatures.map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="p-10 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[40px] relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-8">
                <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <CheckCircle2 className="w-3 h-3" />
                  {feature.status}
                </div>
              </div>
              <div className="w-16 h-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[20px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <feature.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-black text-[var(--text-primary)] mb-4">{feature.title}</h3>
              <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Technical Stack */}
        <div className="bg-slate-900 rounded-[56px] p-12 md:p-24 text-white relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Hardened <br /><span className="text-indigo-400">Infrastructure</span></h2>
              <div className="space-y-10">
                {[
                  { icon: HardDrive, title: 'Data Isolation', desc: 'Tenant-level isolation ensures no cross-contamination of user data.' },
                  { icon: Cpu, title: 'Compliance', desc: 'SOC2 Type II and GDPR compliant data processing practices.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-8">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center shrink-0">
                      <item.icon className="w-7 h-7 text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-black mb-2">{item.title}</p>
                      <p className="text-slate-400 font-medium text-lg leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 backdrop-blur-2xl rounded-[40px] p-10 md:p-14">
              <h3 className="text-2xl font-black mb-8">Security Checklist</h3>
              <div className="space-y-6">
                {[
                  '24/7 Monitoring & Alerting',
                  'Quarterly External Audits',
                  'Continuous Vulnerability Scanning',
                  'Secure Development Lifecycle',
                  'Least Privilege Access Policy',
                  'Regular Incident Response Drills'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    </div>
                    <span className="text-slate-200 font-bold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bug Bounty */}
        <div className="mt-32 text-center max-w-3xl mx-auto">
          <p className="text-3xl font-black text-[var(--text-primary)] mb-6">Security is a partnership.</p>
          <p className="text-lg text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
            If you believe you've discovered a vulnerability in ResumeMorph, please report it to our security team. We reward responsible disclosure.
          </p>
          <button className="px-10 py-4 border-2 border-indigo-600 text-indigo-600 rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
            Report a Vulnerability
          </button>
        </div>
      </div>
    </div>
  );
}
