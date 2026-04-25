import React from 'react';
import { motion } from 'motion/react';
import { 
  BookOpen, 
  Info, 
  MessageSquare, 
  Send, 
  Shield, 
  Zap, 
  Rocket, 
  Target, 
  Sparkles,
  RefreshCw,
  Globe,
  LifeBuoy
} from 'lucide-react';
import { cn } from '../lib/utils';

interface ResourceCardProps {
  title: string;
  desc: string;
  icon: any;
  onClick: () => void;
  color: string;
  bg: string;
  badge?: string;
}

function ResourceCard({ title, desc, icon: Icon, onClick, color, bg, badge }: ResourceCardProps) {
  return (
    <motion.button
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative p-8 bg-white border border-gray-100 rounded-[40px] shadow-sm hover:shadow-2xl hover:shadow-indigo-100 transition-all text-left overflow-hidden"
    >
      <div className={cn("absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700 opacity-50", bg)} />
      
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-lg relative z-10", bg)}>
        <Icon className={cn("w-7 h-7", color)} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-3">
          <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
          {badge && (
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md">
              {badge}
            </span>
          )}
        </div>
        <p className="text-gray-500 font-medium leading-relaxed mb-6 group-hover:text-gray-600 transition-colors">
          {desc}
        </p>
        <div className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors", color)}>
          Explore Resource <Target className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </motion.button>
  );
}

interface ResourcesHubProps {
  onTabChange: (tab: any) => void;
}

export default function ResourcesHub({ onTabChange }: ResourcesHubProps) {
  const mainResources = [
    {
      id: 'guide',
      title: 'Master User Guide',
      desc: 'Complete documentation for the Morph Engine, Smart Editor, and Portfolio Gen.',
      icon: BookOpen,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      badge: 'Popular'
    },
    {
      id: 'about',
      title: 'Our Mission',
      desc: 'Learn about the technology and team behind Resume Morph\'s Style Cloning Engine.',
      icon: Info,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50'
    },
    {
      id: 'feedback',
      title: 'Community Feedback',
      desc: 'See what other users are saying and request features for future updates.',
      icon: MessageSquare,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    {
      id: 'contact',
      title: 'Support Center',
      desc: 'Need technical help? Our support team is available 24/7 for premium users.',
      icon: Send,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    }
  ];

  const quickLinks = [
    { title: 'Privacy Policy', id: 'privacy', icon: Shield },
    { title: 'Resume Builder', id: 'builder', icon: RefreshCw },
    { title: 'Smart Editor', id: 'smart-editor', icon: Sparkles },
    { title: 'Portfolio Gen', id: 'portfolio', icon: Globe },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-8 py-16 md:py-24 font-sans selection:bg-indigo-100">
      {/* Hero Section */}
      <div className="text-center mb-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 text-indigo-600 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] mb-10 border border-indigo-100 shadow-sm"
        >
          <LifeBuoy className="w-4 h-4" />
          Intelligence Hub
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl md:text-8xl font-black text-gray-900 tracking-tighter mb-8 leading-[0.85]"
        >
          How can we help you <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600">Succeed?</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium mb-12 leading-relaxed"
        >
          Everything you need to master Resume Morph and accelerate your career growth, consolidated in one intuitive workspace.
        </motion.p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8 mb-24">
        {mainResources.map((resource, index) => (
          <ResourceCard 
            key={resource.id}
            title={resource.title}
            desc={resource.desc}
            icon={resource.icon}
            color={resource.color}
            bg={resource.bg}
            badge={resource.badge}
            onClick={() => onTabChange(resource.id)}
          />
        ))}
      </div>

      {/* Secondary Resources / Quick Links */}
      <div className="p-12 md:p-20 bg-gray-900 rounded-[56px] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -mr-48 -mt-48" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] -ml-48 -mb-48" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="max-w-md text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-black text-white mb-6">Quick Shortcuts</h2>
              <p className="text-gray-400 font-medium leading-relaxed">
                Jump directly back into your workflow or review our legal documentation with these quick links.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              {quickLinks.map((link) => (
                <button
                  key={link.id}
                  onClick={() => onTabChange(link.id)}
                  className="flex flex-col items-center gap-4 px-8 py-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[32px] hover:bg-white/10 transition-all group"
                >
                  <link.icon className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">{link.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter / Contact Section */}
      <div className="mt-24 text-center">
        <div className="p-1 gap-1 inline-flex bg-gray-50 rounded-2xl mb-8">
          <button className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">Standard Support</button>
          <button className="px-6 py-3 text-gray-400 rounded-xl text-xs font-black uppercase tracking-widest hover:text-gray-600">API Documentation</button>
        </div>
        <p className="text-sm text-gray-400 font-medium">
          Resume Morph v2.4.0 — Unified Resource Network
        </p>
      </div>
    </div>
  );
}
