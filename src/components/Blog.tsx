import React from 'react';
import { motion } from 'motion/react';
import { Calendar, Clock, ChevronRight, Search, Tag, ArrowUpRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Blog() {
  const posts = [
    {
      title: "The Rise of AI in Modern Recruitment",
      excerpt: "How generative AI is changing the way companies hire and how you can leverage it to your advantage.",
      category: "AI & Tech",
      author: "Alex Rivera",
      date: "Jun 24, 2026",
      readTime: "8 min read",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "Mastering the Art of the Video Interview",
      excerpt: "Tips and tricks for looking and sounding professional on camera for your next big opportunity.",
      category: "Career Tips",
      author: "Sarah Chen",
      date: "Jun 20, 2026",
      readTime: "5 min read",
      image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&q=80&w=800"
    },
    {
      title: "ATS Compatibility: Myths vs. Reality",
      excerpt: "Everything you need to know about how applicant tracking systems actually parse your resume in 2026.",
      category: "Resume Strategy",
      author: "Sankalp Suman",
      date: "Jun 15, 2026",
      readTime: "12 min read",
      image: "https://images.unsplash.com/photo-1454165833767-027ffea9e7a7?auto=format&fit=crop&q=80&w=800"
    }
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
            The <span className="saas-gradient-text">Morph Blog</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-medium leading-relaxed">
            Expert insights, career strategies, and the latest in AI-driven professional growth.
          </p>
        </motion.div>

        {/* Featured Post */}
        <div className="mb-24">
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="group relative h-[400px] md:h-[500px] bg-slate-900 rounded-[48px] overflow-hidden cursor-pointer"
          >
            <img 
              src="https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=2000" 
              className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" 
              alt="Featured"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
            <div className="absolute bottom-0 left-0 p-8 md:p-16 w-full max-w-4xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="px-4 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">Featured</span>
                <span className="text-xs font-bold text-slate-300">Jun 27, 2026</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight group-hover:text-indigo-300 transition-colors">
                Beyond the Paper: Why the Future of Hiring is Multi-Dimensional
              </h2>
              <div className="flex items-center gap-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center text-sm font-black">SS</div>
                  <span className="font-bold text-white">Sankalp Suman</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                  <span className="flex items-center gap-2"><Clock className="w-4 h-4" /> 15 min read</span>
                </div>
              </div>
            </div>
            <div className="absolute top-8 right-8 w-14 h-14 bg-white rounded-full flex items-center justify-center -rotate-45 group-hover:rotate-0 transition-transform duration-500">
              <ArrowUpRight className="w-6 h-6 text-slate-900" />
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-8 mb-16">
          <div className="flex flex-wrap items-center gap-3">
            {['All Posts', 'AI & Tech', 'Strategy', 'Interviews', 'Culture'].map((cat, i) => (
              <button 
                key={i}
                className={cn(
                  "px-6 py-2.5 rounded-full text-sm font-bold transition-all",
                  i === 0 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-gray-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full pl-12 pr-6 py-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </div>

        {/* Posts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {posts.map((post, i) => (
            <motion.article 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-[32px] overflow-hidden mb-6">
                <img 
                  src={post.image} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                  alt={post.title}
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-2 bg-white/90 backdrop-blur-md text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                    {post.category}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-4 mb-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {post.date}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {post.readTime}</span>
                </div>
                <h3 className="text-2xl font-black text-[var(--text-primary)] mb-3 group-hover:text-indigo-600 transition-colors leading-tight">
                  {post.title}
                </h3>
                <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6 line-clamp-2">
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black">
                      {post.author.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{post.author}</span>
                  </div>
                  <div className="w-10 h-10 rounded-full border border-[var(--border-color)] flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-600 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-32 p-12 md:p-20 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-800 rounded-[48px] text-center">
          <div className="max-w-2xl mx-auto">
            <Tag className="w-12 h-12 text-indigo-600 mx-auto mb-8" />
            <h2 className="text-4xl font-black text-[var(--text-primary)] mb-6">Stay Ahead of the Curve</h2>
            <p className="text-lg text-[var(--text-secondary)] font-medium mb-10 leading-relaxed">
              Get the latest career strategies and AI tools delivered straight to your inbox. No spam, just pure signal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="flex-1 px-8 py-4 bg-white rounded-2xl border border-indigo-100 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100">
                Subscribe
              </button>
            </div>
            <p className="mt-6 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-widest">
              Join 50,000+ ambitious professionals.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
