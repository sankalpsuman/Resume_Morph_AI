/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import ResumeBuilder from './components/ResumeBuilder';
import About from './components/About';
import { RefreshCw, Layout, Info, User } from 'lucide-react';
import { cn } from './lib/utils'; // Assuming I'll add this or use the one from ResumeBuilder

export default function App() {
  const [activeTab, setActiveTab] = useState<'builder' | 'about'>('builder');

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Global Navigation */}
      <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] bg-white/80 backdrop-blur-2xl border border-gray-200/50 rounded-[28px] p-1.5 shadow-2xl shadow-indigo-100/30 flex items-center gap-1">
        <button 
          onClick={() => setActiveTab('builder')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500",
            activeTab === 'builder' 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Layout className="w-4 h-4" />
          Morph Engine
        </button>
        <button 
          onClick={() => setActiveTab('about')}
          className={cn(
            "flex items-center gap-2.5 px-6 py-2.5 rounded-[22px] text-sm font-black transition-all duration-500",
            activeTab === 'about' 
              ? "bg-indigo-600 text-white shadow-xl shadow-indigo-200" 
              : "text-gray-400 hover:text-gray-900 hover:bg-gray-50"
          )}
        >
          <Info className="w-4 h-4" />
          About & Founder
        </button>
      </nav>

      {activeTab === 'builder' ? <ResumeBuilder /> : <About />}
    </div>
  );
}

