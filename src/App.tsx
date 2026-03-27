/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ResumeBuilder from './components/ResumeBuilder';
import About from './components/About';
import PrivacyPolicy from './components/PrivacyPolicy';
import Contact from './components/Contact';
import { RefreshCw, Layout, Info, Shield, Send, Menu, X } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';

type Tab = 'builder' | 'about' | 'privacy' | 'contact';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'builder', label: 'Morph Engine', icon: Layout },
    { id: 'about', label: 'About & Founder', icon: Info },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'contact', label: 'Contact', icon: Send },
  ];

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Global Navigation */}
      <nav className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-[100] w-[calc(100%-2rem)] md:w-auto">
        <div className="bg-white/80 backdrop-blur-2xl border border-gray-200/50 rounded-[24px] md:rounded-[28px] p-1.5 shadow-2xl shadow-indigo-100/30 flex items-center justify-between md:justify-start gap-1">
          {/* Desktop Tabs */}
          <div className="hidden md:flex items-center gap-1">
            {tabs.map((tab) => (
              <button 
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={cn(
                  "flex items-center gap-2.5 px-5 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500 whitespace-nowrap",
                  activeTab === tab.id 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
                    : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile Logo & Menu Toggle */}
          <div className="flex md:hidden items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-sm tracking-tight">Resume Morph</span>
          </div>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-gray-400 hover:text-gray-900 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white rounded-[24px] border border-gray-200 shadow-2xl p-2 md:hidden"
            >
              {tabs.map((tab) => (
                <button 
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-black transition-all mb-1 last:mb-0",
                    activeTab === tab.id 
                      ? "bg-indigo-50 text-indigo-600" 
                      : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow">
        {activeTab === 'builder' && <ResumeBuilder />}
        {activeTab === 'about' && <About />}
        {activeTab === 'privacy' && <PrivacyPolicy />}
        {activeTab === 'contact' && <Contact />}
      </main>

      {/* Global Footer */}
      <footer className="py-12 border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-100">
              <RefreshCw className="text-white w-4 h-4" />
            </div>
            <span className="font-black text-lg tracking-tight">Resume Morph</span>
          </div>
          <p className="text-sm text-gray-400 font-medium text-center md:text-left">
            © 2026 Resume Morph. Built with passion by Sankalp Suman.
          </p>
          <div className="flex items-center gap-6">
            <button onClick={() => handleTabChange('privacy')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">Privacy</button>
            <button onClick={() => handleTabChange('about')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">About</button>
            <button onClick={() => handleTabChange('contact')} className="text-sm font-bold text-gray-400 hover:text-indigo-600 transition-colors">Contact</button>
          </div>
        </div>
      </footer>
    </div>
  );
}

