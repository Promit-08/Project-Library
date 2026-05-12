import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { 
  Bell, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Star, 
  Trash2, 
  CheckCircle2, 
  Clock,
  ExternalLink,
  ChevronRight,
  Inbox,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  user_id: string;
  actor_id: string;
  project_id: string;
  type: 'like' | 'dislike' | 'comment' | 'rating';
  content: string;
  is_read: boolean;
  created_at: string;
  actor_name?: string;
}

export function Notifications() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbSetupRequired, setDbSetupRequired] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      // Fetch notifications joined with actor profile info if possible
      // For simplicity here, we'll just fetch notifications and maybe resolve names later or use the content
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST204' || error.code === 'PGRST205' || error.message.includes('notifications')) {
          setDbSetupRequired(true);
          return;
        }
        throw error;
      }
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const deleteAllNotifications = async () => {
    try {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;
      setNotifications([]);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <ThumbsUp className="w-4 h-4 text-teal-400" />;
      case 'dislike': return <ThumbsDown className="w-4 h-4 text-rose-400" />;
      case 'comment': return <MessageSquare className="w-4 h-4 text-amber-400" />;
      case 'rating': return <Star className="w-4 h-4 text-purple-400" />;
      default: return <Bell className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className="flex flex-1 flex-col lg:pl-[4.5rem] pb-20 lg:pb-0">
        {/* DB Setup Warning Banner */}
        <AnimatePresence>
          {dbSetupRequired && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b px-6 py-3 flex items-center justify-between gap-4 z-50 sticky top-0 backdrop-blur-md",
                theme === 'dark' ? "bg-amber-500/10 border-amber-500/20" : "bg-amber-50 border-amber-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold font-serif italic">
                  !
                </div>
                <p className={cn(
                  "text-sm font-medium",
                  theme === 'dark' ? "text-amber-200" : "text-amber-800"
                )}>
                  <span className="font-bold">Database Update Required:</span> The "notifications" table is missing in your Supabase schema.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={cn(
                    "border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white",
                    theme === 'light' && "bg-white"
                  )}
                  onClick={() => {
                    const msg = 'Please run the updated SQL in your Supabase Editor to create the "notifications" table.\n\nYou can find the SQL in the "supabase-setup.sql" file in the project directory.';
                    alert(msg);
                  }}
                >
                  How to fix
                </Button>
                <button onClick={() => setDbSetupRequired(false)} className="text-amber-500/50 hover:text-amber-500 p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <main className="flex-1 p-6 lg:p-12 max-w-4xl mx-auto w-full">
          <header className="mb-12 flex items-end justify-between gap-4">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <h1 className={cn(
                "text-4xl font-serif italic mb-2 tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Notifications</h1>
              <p className="text-slate-500 font-light max-w-lg">
                Recent interactions and administrative updates to your collection.
              </p>
            </motion.div>

            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={deleteAllNotifications}
                className="text-teal-500 hover:text-teal-400 hover:bg-teal-500/5 gap-2 uppercase tracking-widest text-[10px] font-bold"
              >
                Clear All <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </header>

          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                <p className="text-slate-600 italic text-sm">Consulting the archives...</p>
              </div>
            ) : notifications.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={cn(
                  "text-center py-32 rounded-[2rem] border transition-colors",
                  theme === 'dark' ? "bg-slate-900/20 border-white/5" : "bg-white border-slate-200"
                )}
              >
                <div className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6",
                  theme === 'dark' ? "bg-white/5" : "bg-slate-50"
                )}>
                  <Inbox className={cn("w-8 h-8", theme === 'dark' ? "text-slate-700" : "text-slate-300")} />
                </div>
                <h2 className={cn(
                  "text-xl font-medium mb-1 font-serif italic transition-colors",
                  theme === 'dark' ? "text-white" : "text-slate-900"
                )}>Your Registry is Empty</h2>
                <p className="text-slate-500 text-sm italic font-light">No new interactions detected in the scholar network.</p>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {notifications.map((notif, idx) => (
                  <motion.div
                    key={notif.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "group p-6 rounded-[1.5rem] border backdrop-blur-md transition-all duration-300 hover:border-teal-500/20 relative",
                      theme === 'dark' 
                        ? (notif.is_read ? "bg-slate-900/40 border-white/5" : "bg-slate-900/80 border-teal-500/10") 
                        : (notif.is_read ? "bg-white border-slate-200" : "bg-teal-50/30 border-teal-200 shadow-sm shadow-teal-500/5")
                    )}
                  >
                    {!notif.is_read && (
                      <div className="absolute top-6 right-6 h-2 w-2 rounded-full bg-teal-500 shadow-lg shadow-teal-500/50" />
                    )}

                    <div className="flex items-start gap-6">
                      <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110 duration-500",
                        theme === 'dark' 
                          ? (!notif.is_read ? "bg-teal-500/10 border-teal-500/20" : "bg-white/5 border-white/5") 
                          : (!notif.is_read ? "bg-teal-500 text-white border-teal-500" : "bg-slate-50 border-slate-200")
                      )}>
                        {getIcon(notif.type)}
                      </div>

                      <div className="flex-1 pt-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                            {new Date(notif.created_at).toLocaleDateString()} at {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h4 className={cn(
                          "font-sans font-light leading-relaxed mb-3 pr-8 transition-colors",
                          theme === 'dark' ? "text-white" : "text-slate-800"
                        )}>
                          {notif.content}
                        </h4>

                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => {
                              markAsRead(notif.id);
                              navigate('/projects');
                            }}
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-widest h-8 px-3 rounded-lg group/btn transition-all",
                              theme === 'dark' ? "bg-teal-500/5 hover:bg-teal-500/10 text-teal-400" : "bg-teal-500 text-white hover:bg-teal-600"
                            )}
                          >
                            View Project <ChevronRight className="w-3 h-3 ml-1 group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                          {!notif.is_read && (
                            <button 
                              onClick={() => markAsRead(notif.id)}
                              className={cn(
                                "text-[10px] uppercase font-bold tracking-widest transition-colors",
                                theme === 'dark' ? "text-slate-500 hover:text-white" : "text-slate-400 hover:text-slate-900"
                              )}
                            >
                              Mark as read
                            </button>
                          )}
                          <button 
                            onClick={() => deleteNotification(notif.id)}
                            className={cn(
                              "text-[10px] uppercase font-bold tracking-widest transition-colors ml-auto opacity-0 group-hover:opacity-100",
                              theme === 'dark' ? "text-slate-500 hover:text-rose-500" : "text-slate-400 hover:text-rose-500"
                            )}
                          >
                            Dismiss
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
