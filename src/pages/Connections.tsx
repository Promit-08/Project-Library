import React, { useState, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { useTheme } from '../components/ThemeProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { 
  Users, 
  Search, 
  UserPlus, 
  UserMinus, 
  MapPin, 
  Briefcase, 
  Book, 
  Loader2,
  ChevronRight,
  UserCircle
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

import { Layout } from '../components/Layout';

export function Connections() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (user) {
      fetchCurrentUserProfile();
      fetchProfiles();
      fetchFollowing();

      const channel = supabase
        .channel('profiles_changes')
        .on('postgres_changes', { event: '*', table: 'profiles' }, () => {
          fetchProfiles();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchCurrentUserProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    if (data) setCurrentUserProfile(data);
  };

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .not('id', 'eq', user?.id)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (err) {
      console.error('Error fetching profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFollowing = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('follows')
        .select('followed_id')
        .eq('follower_id', user.id);

      if (error) {
        console.warn('Follows table might not exist yet:', error.message);
        return;
      }
      setFollowingIds(new Set(data.map(f => f.followed_id)));
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user) return;
    const isFollowing = followingIds.has(targetUserId);

    try {
      setFollowLoading(targetUserId);
      setDbError(null);
      if (isFollowing) {
        const { error } = await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('followed_id', targetUserId);
        if (error) throw error;
        setFollowingIds(prev => {
          const next = new Set(prev);
          next.delete(targetUserId);
          return next;
        });
      } else {
        const { error } = await supabase
          .from('follows')
          .insert({
            follower_id: user.id,
            followed_id: targetUserId
          });
        if (error) throw error;
        setFollowingIds(prev => new Set(prev).add(targetUserId));

        // Create notification
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: user.id,
          type: 'rating',
          content: `${currentUserProfile?.full_name || user.email?.split('@')[0]} started following you.`
        });
      }
    } catch (err: any) {
      console.error('Error toggling follow:', err);
      if (err.code === '42501') {
        setDbError('Access denied: You might need to set up RLS policies for the "follows" table in Supabase.');
      } else if (err.message?.includes('follows')) {
        setDbError('The "follows" table is missing or not reachable. Please run the setup script.');
      } else {
        setDbError('Unable to follow at this time. Please check your database connection.');
      }
    } finally {
      setFollowLoading(null);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.university?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.work?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recommendedProfiles = profiles.filter(p => !followingIds.has(p.id) && (
    (currentUserProfile?.university && p.university === currentUserProfile.university) ||
    (currentUserProfile?.work && p.work === currentUserProfile.work)
  )).slice(0, 4);

  return (
    <Layout>
      <div className="flex-1 flex flex-col pb-24 lg:pb-0">
        {dbError && (
          <div className="bg-rose-500/10 border-b border-rose-500/20 px-6 py-3 flex items-center justify-between gap-4 z-50 sticky top-0 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500 text-lg font-bold">!</div>
              <p className="text-sm font-medium text-rose-200">
                <span className="font-bold">Database Error:</span> {dbError}
              </p>
            </div>
            <Button 
                size="sm" 
                variant="ghost" 
                className="text-rose-500"
                onClick={() => {
                    alert('Please copy and run the code in "supabase-setup.sql" in your Supabase SQL Editor.');
                    setDbError(null);
                }}
            >
                How to fix
            </Button>
          </div>
        )}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          {/* Header */}
          <header className="mb-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h1 className={cn(
                "text-4xl sm:text-5xl font-serif italic tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Connections</h1>
              <p className={cn(
                "font-light max-w-2xl text-lg leading-relaxed transition-colors",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}>
                Expand your academic circle. Discover peers from your institution or field of study and stay connected with their latest research.
              </p>
            </motion.div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-8">
              {/* Search Bar */}
              <div className="relative group w-full max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors z-10" />
                <input 
                  type="text"
                  placeholder="Search by name, university, or work..."
                  className={cn(
                    "w-full border rounded-2xl pl-12 pr-6 py-4 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-xl font-sans",
                    theme === 'dark' 
                      ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-700 focus:bg-slate-800" 
                      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Profiles Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className={cn(
                        "h-48 rounded-3xl animate-pulse",
                        theme === 'dark' ? "bg-white/5" : "bg-slate-200"
                      )} />
                    ))
                  ) : filteredProfiles.length > 0 ? (
                    filteredProfiles.map((p) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        key={p.id}
                        onClick={() => navigate(`/profile/${p.id}`)}
                        className={cn(
                          "group rounded-3xl border p-6 transition-all duration-300 hover:shadow-2xl relative overflow-hidden cursor-pointer",
                          theme === 'dark' ? "bg-slate-900/40 border-white/5 hover:bg-slate-900/60" : "bg-white border-slate-200 hover:border-teal-500/20"
                        )}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <Avatar className="h-16 w-16 border-2 border-teal-500/20 shadow-lg shrink-0">
                              <AvatarImage src={p.avatar_url} />
                              <AvatarFallback className="bg-slate-800 text-teal-500 font-serif italic text-xl">
                                {(p.email || p.full_name)?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <h3 className={cn("text-lg font-serif italic transition-colors truncate", theme === 'dark' ? "text-white" : "text-slate-900")}>
                                {p.full_name || p.email?.split('@')[0] || 'Unknown Scholar'}
                              </h3>
                              <p className="text-xs text-slate-500 font-medium tracking-wide truncate">@{p.username || p.email?.split('@')[0] || 'unknown'}</p>
                            </div>
                          </div>
                          <Button
                            variant={followingIds.has(p.id) ? "outline" : "default"}
                            size="sm"
                            disabled={followLoading === p.id}
                            className={cn(
                              "rounded-xl h-9 px-4 transition-all min-w-[100px] relative z-10 shrink-0",
                              followingIds.has(p.id) 
                                ? (theme === 'dark' ? "border-white/10 text-white hover:bg-rose-500/10 hover:text-rose-500 hover:border-rose-500/50" : "border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200")
                                : "bg-teal-500 text-white hover:bg-teal-600 shadow-lg shadow-teal-500/20"
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFollow(p.id);
                            }}
                          >
                            {followLoading === p.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : followingIds.has(p.id) ? (
                              <span className="flex items-center gap-2"><UserMinus className="w-3.5 h-3.5" /> Unfollow</span>
                            ) : (
                              <span className="flex items-center gap-2"><UserPlus className="w-3.5 h-3.5" /> Follow</span>
                            )}
                          </Button>
                        </div>

                        <div className="mt-6 space-y-3">
                          {p.university && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Book className="w-3.5 h-3.5 text-teal-500/60" />
                              <span className="truncate">{p.university}</span>
                            </div>
                          )}
                          {p.work && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <Briefcase className="w-3.5 h-3.5 text-teal-500/60" />
                              <span className="truncate">{p.work}</span>
                            </div>
                          )}
                          {p.location && (
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <MapPin className="w-3.5 h-3.5 text-teal-500/60" />
                              <span className="truncate">{p.location}</span>
                            </div>
                          )}
                        </div>

                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => navigate(`/profile/${p.id}`)}
                            className="text-teal-500"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-500/10 text-slate-500 mb-4">
                        <Users className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-400">No scholars found</h3>
                      <p className="text-sm text-slate-500 max-w-xs mx-auto mt-2">Try searching for a different name, university, or expertise.</p>
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Sidebar Recommendations */}
            <div className="space-y-8">
              <div>
                <h2 className={cn("text-xs font-bold uppercase tracking-[0.3em] mb-6 flex items-center gap-2", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>
                  Recommended Peers
                </h2>
                <div className="space-y-4">
                  {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-3 animate-pulse">
                        <div className="h-10 w-10 rounded-full bg-slate-200/20" />
                        <div className="space-y-2 flex-1">
                          <div className="h-3 w-2/3 bg-slate-200/20 rounded" />
                          <div className="h-2 w-1/2 bg-slate-200/20 rounded" />
                        </div>
                      </div>
                    ))
                  ) : recommendedProfiles.length > 0 ? (
                    recommendedProfiles.map(p => (
                      <div key={p.id} className="flex items-center justify-between gap-3 group">
                        <div 
                          className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                          onClick={() => navigate(`/profile/${p.id}`)}
                        >
                          <Avatar className="h-10 w-10 border border-teal-500/10">
                            <AvatarImage src={p.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-teal-500 text-sm">
                              {(p.email || p.full_name)?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="overflow-hidden">
                            <h4 className={cn("text-sm font-medium truncate group-hover:text-teal-500 transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>
                                {p.full_name}
                            </h4>
                            <p className="text-[10px] text-slate-500 truncate">{p.university || p.work || 'Scholar'}</p>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={followLoading === p.id}
                          className="h-8 w-8 p-0 rounded-full text-teal-500 hover:bg-teal-500/10 relative z-10"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFollow(p.id);
                          }}
                        >
                          {followLoading === p.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 italic">No recommendations yet. Complete your profile to get matched!</p>
                  )}
                </div>
              </div>

              <div className={cn(
                "p-6 rounded-3xl border transition-colors",
                theme === 'dark' ? "bg-teal-500/5 border-teal-500/10" : "bg-teal-50 border-teal-100"
              )}>
                <h3 className={cn("text-sm font-bold mb-2", theme === 'dark' ? "text-teal-400" : "text-teal-700")}>Pro Tip</h3>
                <p className={cn("text-xs leading-relaxed", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                  Mentioning your university and field of work in your profile helps other scholars find and collaborate with you.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-teal-500 h-auto mt-3 text-xs"
                  onClick={() => navigate('/profile')}
                >
                  Update Profile <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </Layout>

  );
}
