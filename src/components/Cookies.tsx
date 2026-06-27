import React from 'react';
import { motion } from 'motion/react';
import { Cookie, Settings, ShieldCheck, Database, Info, ExternalLink } from 'lucide-react';

export default function Cookies() {
  const cookieTypes = [
    {
      title: "Essential Cookies",
      id: "essential",
      status: "Always Active",
      desc: "Necessary for the website to function. They allow you to navigate and use features like secure account access.",
      icon: ShieldCheck,
      color: "text-emerald-600",
      bg: "bg-emerald-50"
    },
    {
      title: "Performance Cookies",
      id: "performance",
      status: "Active",
      desc: "Help us understand how visitors interact with our site by collecting and reporting information anonymously.",
      icon: Database,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      title: "Preference Cookies",
      id: "preference",
      status: "Active",
      desc: "Enable the website to remember information that changes the way the site behaves or looks, like your preferred theme.",
      icon: Settings,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-[24px] flex items-center justify-center mx-auto mb-8">
            <Cookie className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-[var(--text-primary)] mb-6 tracking-tight">
            Cookie <span className="saas-gradient-text">Policy</span>
          </h1>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--text-tertiary)] mb-4">
            Last Updated: June 27, 2026
          </p>
          <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
            Transparent information about how we use cookies and similar technologies to improve your experience.
          </p>
        </motion.div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px] p-8 md:p-12 mb-16">
          <div className="flex gap-6 mb-12">
            <Info className="w-8 h-8 text-indigo-600 shrink-0" />
            <p className="text-lg text-[var(--text-secondary)] font-medium leading-relaxed">
              Cookies are small text files that are used to store small pieces of information. They are stored on your device when the website is loaded in your browser.
            </p>
          </div>

          <div className="space-y-6">
            {cookieTypes.map((type, i) => (
              <div key={i} className="p-6 rounded-[24px] bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex gap-4">
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", type.bg)}>
                    <type.icon className={cn("w-6 h-6", type.color)} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-[var(--text-primary)]">{type.title}</h3>
                    <p className="text-sm text-[var(--text-secondary)] font-medium mt-1 leading-relaxed max-w-lg">
                      {type.desc}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                    type.id === 'essential' ? "bg-gray-100 text-gray-500" : "bg-indigo-50 text-indigo-600"
                  )}>
                    {type.status}
                  </span>
                  {type.id !== 'essential' && (
                    <button className="w-10 h-6 bg-indigo-600 rounded-full relative p-1 transition-all">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px]">
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-4">How to manage?</h3>
            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
              Most browsers allow you to refuse to accept cookies and to delete cookies. The methods for doing so vary from browser to browser.
            </p>
            <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
              Browser-specific guides <ExternalLink className="w-4 h-4" />
            </button>
          </div>
          <div className="p-8 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-[32px]">
            <h3 className="text-xl font-black text-[var(--text-primary)] mb-4">Third-party cookies</h3>
            <p className="text-[var(--text-secondary)] font-medium leading-relaxed mb-6">
              In addition to our own cookies, we may also use various third-party cookies to report usage statistics of the Service.
            </p>
            <button className="flex items-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
              View partners <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[var(--text-secondary)] font-medium">
            Have questions about our cookie usage? <br />
            Contact us at <span className="text-indigo-600 font-bold">privacy@resumemorph.com</span>
          </p>
        </div>
      </div>
    </div>
  );
}
function cn(...args: any[]) {
  return args.filter(Boolean).join(' ');
}
