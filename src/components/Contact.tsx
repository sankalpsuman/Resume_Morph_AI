import React from 'react';
import { motion } from 'motion/react';
import { Mail, Linkedin, Github, ExternalLink, Send, RefreshCw } from 'lucide-react';

export default function Contact() {
  return (
    <div className="min-h-screen bg-white text-[#1A1A1A] font-sans selection:bg-indigo-100 pt-24 md:pt-32 pb-16 md:pb-24">
      <div className="max-w-4xl mx-auto px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8 md:space-y-12"
        >
          <div className="text-center space-y-4 md:space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest">
              <Send className="w-3 h-3" />
              Get in Touch
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 leading-tight md:leading-none">
              Contact <span className="text-indigo-600">Us.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Have questions, feedback, or just want to say hello? We'd love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="p-8 md:p-10 bg-gray-900 rounded-[32px] md:rounded-[40px] text-white space-y-6 md:space-y-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/10 to-transparent" />
              <div className="relative z-10 space-y-6 md:space-y-8">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Mail className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black tracking-tight">Email Support</h3>
                  <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed">
                    For all inquiries, support requests, and feedback, please reach out to us via email.
                  </p>
                </div>
                <a 
                  href="mailto:sankalpsmn@gmail.com" 
                  className="inline-flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold transition-all"
                >
                  sankalpsmn@gmail.com
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="p-8 md:p-10 bg-indigo-50 rounded-[32px] md:rounded-[40px] space-y-6 md:space-y-8">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                <Linkedin className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-black tracking-tight text-gray-900">Connect with the Founder</h3>
                <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                  Follow Sankalp Suman on LinkedIn for updates on Resume Morph and other professional tools.
                </p>
              </div>
              <a 
                href="https://in.linkedin.com/in/sankalpsuman" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 md:px-6 py-2.5 md:py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl md:rounded-2xl text-white text-xs md:text-sm font-bold transition-all shadow-xl shadow-indigo-100"
              >
                LinkedIn Profile
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
