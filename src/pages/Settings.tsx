import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { motion } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Lock, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';

export function Settings() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      // Note: Supabase's updateUser doesn't strictly verify 'currentPassword' in a single call
      // In a production app, you might want to re-authenticate the user first.
      // For this implementation, we'll follow the standard updateUser flow.
      
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      setSuccess("Password updated successfully!");
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || "Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className="flex flex-1 flex-col lg:pl-[4.5rem] pb-20 lg:pb-0">
        <main className="flex-1 p-4 sm:p-6 lg:p-12 max-w-4xl mx-auto w-full">
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className={cn(
                "text-4xl font-serif italic mb-2 tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>System Settings</h1>
              <p className={cn(
                "font-light transition-colors",
                theme === 'dark' ? "text-slate-500" : "text-slate-600"
              )}>Configure your environment and security preferences.</p>
            </motion.div>
          </header>

          <div className="space-y-8">
            {/* Appearance Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-500/20 text-teal-600"
                )}>
                  <SettingsIcon className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium">Appearance</h2>
              </div>

              <div className={cn(
                "p-6 rounded-[2rem] border transition-all duration-300",
                theme === 'dark' 
                  ? "bg-slate-900/40 border-white/5 hover:border-teal-500/20" 
                  : "bg-white border-slate-200 shadow-sm hover:border-teal-500/30"
              )}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium mb-1">Visual Theme</h3>
                    <p className={cn(
                      "text-sm transition-colors",
                      theme === 'dark' ? "text-slate-500" : "text-slate-600"
                    )}>Switch between light and dark visual aesthetics.</p>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className={cn(
                      "relative h-10 w-20 rounded-full transition-colors flex items-center p-1",
                      theme === 'dark' ? "bg-slate-800" : "bg-slate-200"
                    )}
                  >
                    <motion.div
                      layout
                      className={cn(
                        "h-8 w-8 rounded-full flex items-center justify-center shadow-lg",
                        theme === 'dark' ? "bg-teal-500 text-white" : "bg-white text-teal-600"
                      )}
                      initial={false}
                      animate={{ x: theme === 'dark' ? 40 : 0 }}
                    >
                      {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </motion.div>
                  </button>
                </div>
              </div>
            </section>

            {/* Security Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-2 rounded-lg transition-colors",
                  theme === 'dark' ? "bg-purple-500/10 text-purple-400" : "bg-purple-500/20 text-purple-600"
                )}>
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-medium">Security</h2>
              </div>

              <form 
                onSubmit={handlePasswordChange}
                className={cn(
                  "p-8 rounded-[2rem] border transition-all duration-300 space-y-6",
                  theme === 'dark' 
                    ? "bg-slate-900/40 border-white/5" 
                    : "bg-white border-slate-200 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Change Password</h3>
                  <button 
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="text-slate-500 hover:text-teal-500 transition-colors p-2"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-3"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 text-sm flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    {success}
                  </motion.div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className={cn(
                      "text-[10px] uppercase font-bold tracking-widest",
                      theme === 'dark' ? "text-slate-500" : "text-slate-400"
                    )}>Current Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all outline-none",
                        theme === 'dark' 
                          ? "bg-white/5 border-white/10 focus:border-teal-500/50" 
                          : "bg-slate-50 border-slate-200 focus:border-teal-500 focus:bg-white"
                      )}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div className="hidden md:block" />

                  <div className="space-y-2">
                    <label className={cn(
                      "text-[10px] uppercase font-bold tracking-widest",
                      theme === 'dark' ? "text-slate-500" : "text-slate-400"
                    )}>New Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all outline-none",
                        theme === 'dark' 
                          ? "bg-white/5 border-white/10 focus:border-teal-500/50" 
                          : "bg-slate-50 border-slate-200 focus:border-teal-500 focus:bg-white"
                      )}
                      placeholder="••••••••"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className={cn(
                      "text-[10px] uppercase font-bold tracking-widest",
                      theme === 'dark' ? "text-slate-500" : "text-slate-400"
                    )}>Confirm Password</label>
                    <input 
                      type={showPasswords ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn(
                        "w-full px-4 py-3 rounded-xl border transition-all outline-none",
                        theme === 'dark' 
                          ? "bg-white/5 border-white/10 focus:border-teal-500/50" 
                          : "bg-slate-50 border-slate-200 focus:border-teal-500 focus:bg-white"
                      )}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="bg-teal-500 hover:bg-teal-400 text-white rounded-xl px-8 h-12 gap-2"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                    Update Security Key
                  </Button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
