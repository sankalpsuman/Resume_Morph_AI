import React from 'react';
import { motion } from 'motion/react';
import { Briefcase, MapPin, Users, Heart, Zap, Globe, Cpu, Coffee } from 'lucide-react';

export default function Careers() {
  const jobs = [
    { title: 'AI Engineering Lead', dept: 'Engineering', location: 'Remote / NYC', type: 'Full-time' },
    { title: 'Senior Product Designer', dept: 'Product', location: 'Remote', type: 'Full-time' },
    { title: 'Growth Marketing Manager', dept: 'Marketing', location: 'London', type: 'Full-time' },
    { title: 'Full Stack Developer', dept: 'Engineering', location: 'Remote', type: 'Full-time' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <h1 className="text-5xl md:text-7xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Build the Future of <span className="saas-gradient-text">Work</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto font-medium leading-relaxed">
            Join a mission-driven team dedicated to humanizing the job search through cutting-edge AI and empathetic design.
          </p>
        </motion.div>

        {/* Culture Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
          {[
            { icon: Globe, title: 'Remote First', desc: 'Work from anywhere in the world.' },
            { icon: Heart, title: 'Ownership', desc: 'Every team member is a part-owner.' },
            { icon: Cpu, title: 'Tech Stack', desc: 'Work with the latest AI & LLMs.' },
            { icon: Coffee, title: 'Balance', desc: 'We value results, not hours worked.' },
          ].map((feature, i) => (
            <div key={i} className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] text-center hover:shadow-xl transition-all">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <feature.icon className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">{feature.title}</h3>
              <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Jobs Section */}
        <div className="mb-32">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-3xl font-black text-[var(--text-primary)]">Open Positions</h2>
            <div className="px-4 py-2 bg-indigo-600 text-white rounded-full text-xs font-bold">
              4 Roles Available
            </div>
          </div>

          <div className="space-y-4">
            {jobs.map((job, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="group p-6 md:p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-indigo-400 transition-all cursor-pointer"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-14 h-14 bg-[var(--bg-primary)] rounded-2xl flex items-center justify-center shrink-0 border border-[var(--border-color)] group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                    <div className="flex flex-wrap items-center gap-4 mt-2">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        <Users className="w-3.5 h-3.5" />
                        {job.dept}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider">
                        <MapPin className="w-3.5 h-3.5" />
                        {job.location}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="px-4 py-2 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                    {job.type}
                  </span>
                  <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-100">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Hiring Process */}
        <div className="bg-slate-900 rounded-[48px] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Our Simple <br /><span className="text-indigo-400">Hiring Process</span></h2>
              <div className="space-y-8">
                {[
                  { step: '01', title: 'Application Review', desc: 'We review your profile and portfolio within 48 hours.' },
                  { step: '02', title: 'Intro Chat', desc: 'A casual conversation about your background and our mission.' },
                  { step: '03', title: 'Deep Dive', desc: 'A technical or strategic discussion with your future peers.' },
                  { step: '04', title: 'Final Offer', desc: 'Welcome to the team! We offer competitive pay & equity.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-6">
                    <span className="text-2xl font-black text-indigo-500/50 font-mono">{item.step}</span>
                    <div>
                      <p className="text-xl font-black mb-1">{item.title}</p>
                      <p className="text-slate-400 font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/5 border border-white/10 backdrop-blur-xl rounded-[40px] p-10 text-center">
              <Zap className="w-16 h-16 text-indigo-400 mx-auto mb-8 animate-pulse" />
              <h3 className="text-2xl font-black mb-4">Don't see a role?</h3>
              <p className="text-slate-300 font-medium mb-8 leading-relaxed">
                We're always looking for exceptional talent. If you're passionate about the future of career tech, send us an open application.
              </p>
              <button className="w-full py-4 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all">
                Send Open Application
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
