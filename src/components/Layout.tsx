import React from 'react';
import { SessionNavBar } from './ui/sidebar';
import { Footer } from './Footer';
import { useTheme } from './ThemeProvider';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

export function Layout({ children, showFooter = true }: LayoutProps) {
  const { theme } = useTheme();

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />
      <div className="relative flex flex-1 flex-col lg:pl-[4.5rem] pb-16 lg:pb-0">
        <div className="flex-1">
          {children}
        </div>
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
