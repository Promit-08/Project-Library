import * as React from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { Book, Search, Bell, Plus, User, Settings, Loader2, Sparkles, FolderOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

import { Layout } from '../components/Layout';

export function Home() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [stats, setStats] = React.useState({
    activeProjects: 0,
    myWorks: 0,
    totalScholars: 0,
    loading: true
  });

  React.useEffect(() => {
    if (user) {
      fetchStats();
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (data) {
      setProfile(data);
    } else if (!error && user) {
      // Auto-create profile if missing
      const initialProfile = {
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
      };
      
      const { data: newData } = await supabase
        .from('profiles')
        .insert([initialProfile])
        .select()
        .single();
      
      if (newData) {
        setProfile(newData);
      }
    }
  };

  const fetchStats = async () => {
    try {
      const [
        { count: totalProjects }, 
        { count: myProjects }, 
        { count: totalScholarsCount }
      ] = await Promise.all([
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        user ? supabase.from('projects').select('*', { count: 'exact', head: true }).eq('student_id', user.id) : { count: 0 },
        supabase.from('profiles').select('*', { count: 'exact', head: true })
      ]);

      setStats({
        activeProjects: totalProjects || 0,
        myWorks: myProjects || 0,
        totalScholars: totalScholarsCount || 0,
        loading: false
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  };

  React.useEffect(() => {
    if (!user) return;

    // Realtime subscriptions for stats
    const projectsSubscription = supabase
      .channel('projects_stats')
      .on('postgres_changes', { event: '*', table: 'projects' }, () => {
        fetchStats();
      })
      .subscribe();

    const profilesSubscription = supabase
      .channel('profiles_stats')
      .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
        fetchStats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(projectsSubscription);
      supabase.removeChannel(profilesSubscription);
    };
  }, [user]);

  const displayName = profile?.full_name || user?.email?.split('@')[0];

  return (
    <Layout>
      <div className="relative flex-1">
        {/* Background Image with Overlay */}
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
          style={{ 
            backgroundImage: `url('https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&q=80&w=2000')`,
            filter: theme === 'dark' ? 'brightness(0.3) saturate(0.8) contrast(1.1)' : 'brightness(1.1) saturate(1.2)'
          }}
        />
        <div className={cn(
          "absolute inset-0 z-0 bg-gradient-to-b transition-colors duration-500",
          theme === 'dark' ? "from-slate-950/50 via-transparent to-slate-950" : "from-white/90 via-white/40 to-white"
        )} />

        {/* Main Content */}
        <main className="relative z-10 flex-1 overflow-y-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold tracking-widest uppercase mb-6">
                <Plus className="h-3 w-3" />
                Welcome back, {displayName}
              </div>
              
              <h1 className={cn(
                "text-5xl md:text-7xl font-serif italic leading-tight mb-8 transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                Your sanctuary for <span className="text-teal-400 italic font-medium">knowledge</span> and <span className="text-teal-400">collaboration</span>.
              </h1>
              
              <p className={cn(
                "text-lg md:text-xl font-light leading-relaxed mb-12 max-w-2xl transition-colors",
                theme === 'dark' ? "text-slate-400" : "text-slate-700"
              )}>
                Access your scholarly collection, discover groundbreaking research from peers, and contribute to the expanding universe of undergraduate innovation.
              </p>

              <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => navigate('/projects')}
                  className="px-8 py-4 rounded-xl bg-teal-500 text-white font-bold text-sm tracking-widest uppercase hover:bg-teal-400 transition-all shadow-xl shadow-teal-500/20 active:scale-95 flex items-center gap-2"
                >
                  <Search className="w-4 h-4" /> Enter Library
                </button>
                <button 
                  onClick={() => navigate('/profile')}
                  className={cn(
                    "px-8 py-4 rounded-xl border font-bold text-sm tracking-widest uppercase transition-all backdrop-blur-sm active:scale-95 flex items-center gap-2",
                    theme === 'dark' ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-slate-900/5 border-slate-900/10 text-slate-900 hover:bg-slate-900/10"
                  )}
                >
                  <FolderOpen className="w-4 h-4" /> My Works
                </button>
              </div>
            </motion.div>

            {/* Stats / Quick Info */}
            <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { label: 'Active Projects', value: stats.activeProjects.toString(), icon: Book, color: 'text-teal-500' },
                { label: 'Contributing Scholars', value: stats.totalScholars.toString(), icon: User, color: 'text-amber-500' },
                { label: 'My Personal Archive', value: stats.myWorks.toString(), icon: Sparkles, color: 'text-purple-500' },
              ].map((stat, i) => (
                <motion.div 
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 + (i * 0.1) }}
                  className={cn(
                    "p-8 rounded-[2rem] border backdrop-blur-md transition-all duration-500 group cursor-default shadow-2xl relative overflow-hidden",
                    theme === 'dark' 
                      ? "bg-slate-900/40 border-white/5 hover:bg-slate-900/60 hover:border-teal-500/30" 
                      : "bg-white border-slate-200 hover:bg-slate-50 hover:border-teal-500/20"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <stat.icon className="w-24 h-24" />
                  </div>
                  {stats.loading ? (
                    <Loader2 className="h-6 w-6 text-slate-700 animate-spin mb-4" />
                  ) : (
                    <stat.icon className={`h-6 w-6 ${stat.color} mb-4 group-hover:scale-125 transition-transform duration-500`} />
                  )}
                  <div className={cn(
                    "text-4xl font-bold mb-1 font-serif italic transition-colors",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>
                    {stats.loading ? '...' : stat.value}
                  </div>
                  <div className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500 group-hover:text-slate-300 transition-colors">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </main>

        {/* Decorative Quote */}
        <div className={cn(
          "relative z-10 w-full px-6 py-8 text-center transition-colors text-slate-400 font-light"
        )}>
          <p className="text-[10px] font-medium tracking-[0.2em] uppercase transition-colors">"The only thing that you absolutely have to know, is the location of the library." — Albert Einstein</p>
        </div>
      </div>
    </Layout>

  );
}
