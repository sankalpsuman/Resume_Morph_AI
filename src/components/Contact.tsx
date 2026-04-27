import React from 'react';
import { motion } from 'motion/react';
import { Mail, Linkedin, Github, ExternalLink, Send, RefreshCw } from 'lucide-react';

export default function Contact() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans selection:bg-indigo-100 py-8 md:py-20 rounded-[24px] md:rounded-[40px] shadow-sm border border-[var(--border-color)] overflow-hidden relative transition-colors duration-300">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-5%] right-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-indigo-50/50 dark:bg-indigo-900/10 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-[20%] left-[-5%] w-[250px] md:w-[400px] h-[250px] md:h-[400px] bg-purple-50/50 dark:bg-purple-900/10 rounded-full blur-[70px] md:blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-16 md:space-y-32"
        >
          <div className="text-center space-y-6 md:space-y-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800 rounded-full text-indigo-600 dark:text-indigo-400 text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mb-2 shadow-sm">
              <Send className="w-3 md:w-4 h-3 md:h-4" />
              Direct Support Channel
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-8xl font-black tracking-tighter text-[var(--text-primary)] leading-[1.1] md:leading-[0.85]">
              Let's Scale Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600">Professional Narrative.</span>
            </h1>
            <p className="text-base md:text-2xl text-[var(--text-secondary)] font-medium max-w-2xl mx-auto leading-relaxed px-4 md:px-0">
              Whether you're a high-performing professional seeking an edge or looking for enterprise-grade solutions, our team is standing by.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-16">
            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 md:p-12 lg:p-16 bg-gray-950 dark:bg-gray-900 rounded-[40px] md:rounded-[64px] text-white space-y-8 relative overflow-hidden group border border-white/5 shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500">
                  <Mail className="w-6 md:w-8 h-6 md:h-8 text-white" />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <h3 className="text-2xl md:text-4xl font-black tracking-tight leading-tight md:leading-none">Support & Strategic <br className="hidden md:block" />Inquiries</h3>
                  <p className="text-sm md:text-lg text-gray-400 font-medium leading-relaxed max-w-md">
                    Our team typically responds within 24 hours. For enterprise inquiries, please include your organization name for priority routing.
                  </p>
                </div>
                <a 
                  href="mailto:sankalpsmn@gmail.com" 
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-white text-gray-950 rounded-[20px] md:rounded-[28px] text-[10px] md:text-sm font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-900/40"
                >
                  sankalpsmn@gmail.com
                  <ExternalLink className="w-4 md:w-5 h-4 md:h-5" />
                </a>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="p-8 md:p-12 lg:p-16 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-[40px] md:rounded-[64px] space-y-8 relative overflow-hidden group shadow-sm hover:shadow-2xl hover:shadow-indigo-100/50 transition-all border-b-4 border-b-indigo-600"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 dark:bg-indigo-900/20 rounded-full -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-1000" />
              <div className="relative z-10 space-y-8">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-600 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-xl shadow-indigo-100 dark:shadow-none group-hover:scale-110 transition-transform duration-500">
                  <Linkedin className="w-6 md:w-8 h-6 md:h-8 text-white" />
                </div>
                <div className="space-y-4 md:space-y-6">
                  <h2 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em]">Strategic Partnerships</h2>
                  <h3 className="text-2xl md:text-4xl font-black tracking-tight text-[var(--text-primary)] leading-tight md:leading-none">Connect with <br className="hidden md:block" />the Founder</h3>
                  <p className="text-sm md:text-lg text-[var(--text-secondary)] font-medium leading-relaxed max-w-md">
                    Join Sankalp's professional network for direct dialogue on career technology, AI architecture, or to share your success stories.
                  </p>
                </div>
                <a 
                  href="https://www.linkedin.com/in/sankalpsuman/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-6 md:px-10 py-4 md:py-5 bg-indigo-600 hover:bg-indigo-700 rounded-[20px] md:rounded-[28px] text-white text-[10px] md:text-sm font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-100 dark:shadow-none"
                >
                  LinkedIn Profile
                  <ExternalLink className="w-4 md:w-5 h-4 md:h-5" />
                </a>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
