import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, Globe, RefreshCw } from 'lucide-react';

export default function PrivacyPolicy() {
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
              <Shield className="w-3 h-3" />
              Privacy & Security
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-gray-900 leading-tight md:leading-none">
              Privacy <span className="text-indigo-600">Policy.</span>
            </h1>
            <p className="text-base md:text-lg text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed">
              Last updated: March 27, 2026. Your data privacy is our core priority.
            </p>
          </div>

          <div className="grid gap-6 md:gap-8">
            <section className="p-6 md:p-8 bg-gray-50 rounded-[24px] md:rounded-[32px] border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Data Handling</h2>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                Resume Morph operates on a "Privacy-First" principle. We do not store your uploaded resumes or personal data on our servers permanently. All processing is done in real-time to generate your morphed resume.
              </p>
            </section>

            <section className="p-6 md:p-8 bg-white rounded-[24px] md:rounded-[32px] border border-gray-100 space-y-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-purple-100">
                  <Eye className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Information We Collect</h2>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                We only collect the information you explicitly provide (uploaded files and job descriptions) to perform the resume morphing service. This data is transmitted securely to our AI processing engine and is not used for training purposes or shared with third parties.
              </p>
            </section>

            <section className="p-6 md:p-8 bg-gray-50 rounded-[24px] md:rounded-[32px] border border-gray-100 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                  <Globe className="w-5 h-5" />
                </div>
                <h2 className="text-xl md:text-2xl font-black tracking-tight">Cookies & Analytics</h2>
              </div>
              <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                We use minimal cookies strictly for session management and basic, anonymous analytics to improve our service. We do not track your activity across other websites or sell your data to advertisers.
              </p>
            </section>
          </div>

          <div className="pt-12 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400 font-medium">
              If you have any questions about our privacy practices, please contact us at <a href="mailto:sankalpsmn@gmail.com" className="text-indigo-600 font-bold hover:underline">sankalpsmn@gmail.com</a>.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
