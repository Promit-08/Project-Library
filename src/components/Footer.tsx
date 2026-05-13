import React from 'react';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

export function Footer() {
  const { theme } = useTheme();
  
  return (
    <footer className={cn(
      "w-full px-6 py-12 text-center transition-colors mt-auto",
      theme === 'dark' ? "text-slate-500 border-t border-white/5" : "text-slate-400 border-t border-slate-200"
    )}>
      <div className="max-w-7xl mx-auto space-y-2">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase opacity-70 transition-colors">
          Developed by Promit
        </p>
        <div className="h-px w-12 bg-teal-500/30 mx-auto" />
        <p className="text-[8px] font-medium tracking-widest uppercase opacity-40">
          © {new Date().getFullYear()} Project Library Sanctuary
        </p>
      </div>
    </footer>
  );
}
