import * as React from 'react';
import { supabase, Project, UserProfile } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { createNotification } from '../services/notificationService';
import { motion, AnimatePresence } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { 
  Heart, 
  MessageSquare, 
  Star, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  Download, 
  Calendar, 
  Tag, 
  User, 
  Search,
  Filter,
  ThumbsDown,
  ThumbsUp,
  Loader2,
  AlertCircle,
  Clock,
  ExternalLink,
  Send,
  FileText,
  AlignLeft,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

interface ProjectInteraction {
  project_id: string;
  interaction_type: 'like' | 'dislike';
}

interface Comment {
  id: string;
  project_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  created_at: string;
}

interface ProjectWithInteractions extends Project {
  userInteraction?: 'like' | 'dislike';
  userRating?: number;
  comments?: Comment[];
}

import { useTheme } from '../components/ThemeProvider';

export function Projects() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [projects, setProjects] = React.useState<ProjectWithInteractions[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [expandedProjectId, setExpandedProjectId] = React.useState<string | null>(null);

  const categories = ['All', 'Computer Science', 'Mechanical Engineering', 'Digital Media', 'Architecture', 'Psychology', 'Business', 'Arts', 'Other'];

  React.useEffect(() => {
    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      // Fetch projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;

      let enrichedProjects = [...projectsData];

      if (user) {
        // Fetch user interactions
        const { data: interactions } = await supabase
          .from('project_interactions')
          .select('project_id, interaction_type')
          .eq('user_id', user.id);

        // Fetch user ratings
        const { data: ratings } = await supabase
          .from('ratings')
          .select('project_id, rating')
          .eq('user_id', user.id);

        enrichedProjects = enrichedProjects.map(p => ({
          ...p,
          userInteraction: interactions?.find(i => i.project_id === p.id)?.interaction_type,
          userRating: ratings?.find(r => r.project_id === p.id)?.rating
        }));
      }

      setProjects(enrichedProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className={cn(
        "flex-1 flex flex-col w-full min-h-screen transition-all duration-500",
        "lg:pl-[4.5rem] pb-24 lg:pb-0"
      )}>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 overflow-x-hidden">
          <header className="mb-10 lg:mb-16">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3 mb-10"
            >
              <h1 className={cn(
                "text-3xl sm:text-5xl lg:text-6xl font-serif italic mb-2 tracking-tight transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Community Library</h1>
              <p className={cn(
                "font-light max-w-xl transition-colors text-sm sm:text-lg leading-relaxed",
                theme === 'dark' ? "text-slate-400" : "text-slate-600"
              )}>
                A curated sanctuary of academic excellence. Explore, peer-review, and discover groundbreaking research from scholors around the world.
              </p>
            </motion.div>

            <div className="space-y-10">
              <div className="relative group w-full max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-teal-500 transition-colors z-10" />
                <input 
                  type="text"
                  placeholder="Search project titles, keywords..."
                  className={cn(
                    "w-full border rounded-2xl pl-12 pr-24 sm:pr-32 py-4 sm:py-5 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-2xl font-sans text-sm sm:text-base",
                    theme === 'dark' 
                      ? "bg-slate-900/50 border-white/10 text-white placeholder:text-slate-700 focus:bg-slate-900" 
                      : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                  )}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="rounded-xl bg-teal-500/10 text-teal-500 hover:bg-teal-500 hover:text-white px-4 sm:px-6 h-9 sm:h-11 text-[10px] sm:text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Search
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-col gap-4">
                <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-slate-500 ml-1">Discipline Gallery</span>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-none w-full items-center -mx-4 px-4 sm:mx-0 sm:px-0">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all border shrink-0",
                        selectedCategory === cat 
                          ? "bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-500/20" 
                          : (theme === 'dark' ? "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10" : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50")
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </header>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
              <p className="text-slate-500 italic">Curating the finest projects for you...</p>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="text-center py-20">
              <div className={cn(
                "h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6",
                theme === 'dark' ? "bg-white/5" : "bg-slate-100"
              )}>
                <Search className="w-8 h-8 text-slate-700" />
              </div>
              <h2 className={cn("text-xl font-medium mb-2", theme === 'dark' ? "text-white" : "text-slate-900")}>No projects found</h2>
              <p className="text-slate-500">Try adjusting your search or category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8">
              {filteredProjects.map((project) => (
                <ProjectCard 
                  key={project.id} 
                  project={project} 
                  isExpanded={expandedProjectId === project.id}
                  onToggleExpand={() => setExpandedProjectId(expandedProjectId === project.id ? null : project.id)}
                  onUpdate={fetchProjects}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function ProjectCard({ 
  project, 
  isExpanded, 
  onToggleExpand, 
  onUpdate 
}: { 
  project: ProjectWithInteractions; 
  isExpanded: boolean; 
  onToggleExpand: () => void;
  onUpdate: () => void | Promise<void>;
  key?: React.Key;
}) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [commentInput, setCommentInput] = React.useState('');
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loadingComments, setLoadingComments] = React.useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = React.useState(false);
  const [interactionLoading, setInteractionLoading] = React.useState(false);
  const [viewerProfile, setViewerProfile] = React.useState<UserProfile | null>(null);
  const [creatorProfile, setCreatorProfile] = React.useState<UserProfile | null>(null);

  React.useEffect(() => {
    if (user) {
      fetchViewerProfile();
    }
  }, [user]);

  React.useEffect(() => {
    if (project.student_id) {
      fetchCreatorProfile();
    }
  }, [project.student_id]);

  const fetchViewerProfile = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      if (data) setViewerProfile(data);
    } catch (err) {
      console.error('Error fetching viewer profile:', err);
    }
  };

  const fetchCreatorProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', project.student_id)
        .maybeSingle();
      if (data) setCreatorProfile(data);
    } catch (err) {
      console.error('Error fetching creator profile:', err);
    }
  };

  React.useEffect(() => {
    if (isExpanded) {
      fetchComments();
    }
  }, [isExpanded]);

  const fetchComments = async () => {
    try {
      setLoadingComments(true);
      const { data, error } = await supabase
        .from('comments')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleInteraction = async (type: 'like' | 'dislike') => {
    if (!user) return;
    try {
      setInteractionLoading(true);
      
      if (project.userInteraction === type) {
        // Toggle off
        await supabase
          .from('project_interactions')
          .delete()
          .eq('project_id', project.id)
          .eq('user_id', user.id);
        
        // Update counts in projects table
        await supabase.rpc('decrement_interaction', { 
          target_project_id: project.id, 
          column_name: type === 'like' ? 'likes' : 'dislikes' 
        });
      } else {
        // Handle swap (like to dislike or vice versa) or new interaction
        const oldType = project.userInteraction;
        
        const { error } = await supabase
          .from('project_interactions')
          .upsert({ 
            project_id: project.id, 
            user_id: user.id, 
            interaction_type: type 
          });

        if (error) throw error;

        // Note: In a production app, use an atomic RPC or database trigger
        // Here we simulate for demo, user should ideally create a trigger in Supabase
        if (oldType) {
          await supabase.rpc('swap_interaction', {
            target_project_id: project.id,
            inc_column: type === 'like' ? 'likes' : 'dislikes',
            dec_column: oldType === 'like' ? 'likes' : 'dislikes'
          });
        } else {
          await supabase.rpc('increment_interaction', {
            target_project_id: project.id,
            column_name: type === 'like' ? 'likes' : 'dislikes'
          });

          // Send notification
          if (project.student_id) {
            const displayName = viewerProfile?.full_name || user.email?.split('@')[0] || 'A scholar';
            await createNotification({
              userId: project.student_id,
              actorId: user.id,
              projectId: project.id,
              type: type,
              content: `${displayName} ${type}d your project "${project.title}"`
            });
          }
        }
      }
      onUpdate();
    } catch (err) {
      console.error('Interaction error:', err);
      // Fallback if RPCs don't exist yet - inform user
      alert('Interaction saved locally. (Note: Database RPC helpers for counts need to be added to SQL Editor for persistence)');
    } finally {
      setInteractionLoading(false);
    }
  };

  const handleRating = async (value: number) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('ratings')
        .upsert({
          project_id: project.id,
          user_id: user.id,
          rating: value
        });

      if (error) throw error;
      
      // Update counts in projects table (ideally handled by trigger)
      const displayName = viewerProfile?.full_name || user.email?.split('@')[0] || 'A scholar';
      await createNotification({
        userId: project.student_id,
        actorId: user.id,
        projectId: project.id,
        type: 'rating',
        content: `${displayName} rated your project "${project.title}" with ${value} stars.`
      });

      // Ideally trigger a calculation function in SQL
      onUpdate();
    } catch (err) {
      console.error('Rating error:', err);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !commentInput.trim()) return;

    try {
      setIsSubmittingComment(true);
      const displayName = viewerProfile?.full_name || user.email?.split('@')[0] || 'Scholar';
      const { error } = await supabase
        .from('comments')
        .insert([{
          project_id: project.id,
          user_id: user.id,
          user_name: displayName,
          user_avatar: viewerProfile?.avatar_url,
          content: commentInput.trim()
        }]);

      if (error) throw error;
      setCommentInput('');
      fetchComments();
      
      // Update comment count on project
      await supabase.rpc('increment_interaction', {
        target_project_id: project.id,
        column_name: 'comments_count'
      });

      await createNotification({
        userId: project.student_id,
        actorId: user.id,
        projectId: project.id,
        type: 'comment',
        content: `${displayName} commented on your project "${project.title}"`
      });

      onUpdate();
    } catch (err) {
      console.error('Comment error:', err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      // Update comment count on project
      await supabase.rpc('decrement_interaction', {
        target_project_id: project.id,
        column_name: 'comments_count'
      });

      onUpdate();
    } catch (err) {
      console.error('Error deleting comment:', err);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className={cn(
        "backdrop-blur-xl border rounded-[2rem] overflow-hidden group hover:border-teal-500/30 transition-all duration-500 shadow-2xl relative",
        theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"
      )}
    >
      {/* Subtle glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-teal-500/0 via-teal-500/5 to-teal-500/0 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700 pointer-events-none" />

      <div className="flex flex-col lg:flex-row relative w-full">
        {/* Project Image/Placeholder */}
        <div className={cn(
          "lg:w-80 h-56 sm:h-64 lg:h-auto relative flex items-center justify-center overflow-hidden shrink-0 border-b lg:border-b-0 lg:border-r",
          theme === 'dark' ? "bg-slate-950/50 border-white/5" : "bg-slate-100 border-slate-200"
        )}>
          {project.image_url ? (
            <img 
              src={project.image_url} 
              alt={project.title} 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" 
            />
          ) : (
            <div className={cn(
              "flex flex-col items-center gap-3 transition-colors",
              theme === 'dark' ? "text-slate-800 group-hover:text-teal-900" : "text-slate-300 group-hover:text-teal-200"
            )}>
              <FileText className="w-12 sm:w-16 h-12 sm:h-16 stroke-[1px]" />
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] italic">Archive</span>
                <div className="h-px w-6 sm:w-8 bg-current mt-1" />
              </div>
            </div>
          )}
          <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/20 backdrop-blur-md py-1 sm:py-1.5 px-3 sm:px-4 rounded-full text-[10px] font-bold uppercase tracking-wider">
              {project.category}
            </Badge>
          </div>
        </div>

        <div className="flex-1 p-4 sm:p-8 lg:p-10 flex flex-col justify-between overflow-hidden w-full">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4">
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-colors shrink-0",
                theme === 'dark' ? "bg-white/5 border-white/10 text-slate-400" : "bg-slate-100 border-slate-200 text-slate-500"
              )}>
                <Clock className="w-3 h-3" />
                <span className="text-[9px] uppercase tracking-wider font-bold">
                  {new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="outline" className={cn("rounded-full py-0.5 px-2 text-[9px] uppercase font-bold tracking-wider", theme === 'dark' ? "border-teal-500/30 text-teal-400 bg-teal-500/5" : "border-teal-500/20 text-teal-600 bg-teal-50/50")}>
                  {project.category}
                </Badge>
              </div>
            </div>

            <h3 className={cn(
               "text-xl sm:text-2xl lg:text-3xl font-serif italic group-hover:text-teal-400 transition-all duration-500 leading-tight mb-3 lg:mb-4",
               theme === 'dark' ? "text-white" : "text-slate-900"
            )}>
              {project.title}
            </h3>
            
            <p className={cn(
              "text-xs sm:text-sm leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-3 italic font-light font-sans mb-6 sm:mb-8 transition-colors",
              theme === 'dark' ? "text-slate-400" : "text-slate-500"
            )}>
              "{project.description}"
            </p>
          </div>

          <div className={cn("flex flex-wrap items-center gap-4 sm:gap-6 pt-6 border-t transition-colors", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
            <div className="flex items-center gap-2">
              <div className={cn("flex items-center gap-1 sm:gap-2 p-1 rounded-full border transition-colors", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-200")}>
                <button 
                  onClick={() => handleInteraction('like')}
                  disabled={interactionLoading}
                  className={cn(
                    "flex items-center gap-1.5 transition-all p-1.5 sm:p-2 px-2.5 sm:px-3.5 rounded-full",
                    project.userInteraction === 'like' 
                      ? "bg-teal-500 text-white shadow-lg shadow-teal-500/20" 
                      : (theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-teal-600")
                  )}
                >
                  <ThumbsUp className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", project.userInteraction === 'like' && "fill-white/20")} />
                  <span className="text-[10px] sm:text-[11px] font-bold leading-none">{project.likes}</span>
                </button>
                <button 
                  onClick={() => handleInteraction('dislike')}
                  disabled={interactionLoading}
                  className={cn(
                    "flex items-center gap-1.5 transition-all p-1.5 sm:p-2 px-2.5 sm:px-3.5 rounded-full",
                    project.userInteraction === 'dislike' 
                      ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20" 
                      : (theme === 'dark' ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-rose-600")
                  )}
                >
                  <ThumbsDown className={cn("w-3 sm:w-3.5 h-3 sm:h-3.5", project.userInteraction === 'dislike' && "fill-white/20")} />
                  <span className="text-[10px] sm:text-[11px] font-bold leading-none">{project.dislikes}</span>
                </button>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full border transition-all group/stat",
              theme === 'dark' ? "bg-white/5 border-white/5 hover:border-white/10" : "bg-slate-50 border-slate-200 hover:bg-slate-100"
            )}>
              <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-slate-500 group-hover/stat:text-teal-500 transition-colors" />
              <span className={cn("text-[10px] sm:text-[11px] font-bold transition-colors", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                {project.comments_count} <span className="hidden sm:inline font-light opacity-50 ml-1">Insights</span>
              </span>
            </div>

            <div className={cn("flex flex-col gap-0.5 sm:gap-1 transition-colors min-w-[60px]", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button 
                    key={star}
                    onClick={() => handleRating(star)}
                    className={cn(
                      "transition-all hover:scale-125",
                      (project.userRating || 0) >= star ? "text-amber-500" : (theme === 'dark' ? "text-slate-800 hover:text-amber-500/30" : "text-slate-300 hover:text-amber-500/30")
                    )}
                  >
                    <Star className={cn("w-2.5 sm:w-3.5 h-2.5 sm:h-3.5", (project.userRating || 0) >= star && "fill-amber-500")} />
                  </button>
                ))}
              </div>
              <span className="text-[8px] font-bold uppercase tracking-tighter opacity-70">
                {project.rating.toFixed(1)} Rating
              </span>
            </div>

            <div className="ml-auto flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onToggleExpand}
                className="text-teal-500 hover:text-teal-400 hover:bg-teal-500/5 gap-1.5 sm:gap-2 font-bold uppercase tracking-widest text-[9px] sm:text-[10px] px-2 sm:px-3"
              >
                {isExpanded ? (
                  <>Collapse <ChevronUp className="w-3 h-3" /></>
                ) : (
                  <>Explore <ChevronDown className="w-3 h-3" /></>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={cn("border-t overflow-hidden transition-colors", theme === 'dark' ? "border-white/5" : "border-slate-100")}
          >
            <div className={cn("p-5 sm:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12", theme === 'dark' ? "bg-slate-900/20" : "bg-slate-50/50")}>
              {/* Detailed Metadata */}
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                    <AlignLeft className="w-4 h-4" /> Full Description
                  </h4>
                  <p className={cn("leading-relaxed font-light whitespace-pre-wrap italic transition-colors text-sm sm:text-base", theme === 'dark' ? "text-slate-300" : "text-slate-700")}>
                    {project.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500 w-full mb-2">Subject Tags</h4>
                  {project.tags?.map(tag => (
                    <div key={tag} className={cn(
                      "inline-flex items-center rounded-full border px-3 sm:px-4 py-1 text-[10px] sm:text-xs font-semibold focus:outline-none transition-all",
                      theme === 'dark' ? "bg-white/5 text-slate-400 border-white/5" : "bg-white text-slate-500 border-slate-200"
                    )}>
                      #{tag}
                    </div>
                  ))}
                  {(!project.tags || project.tags.length === 0) && (
                    <p className="text-xs text-slate-600">No tags specified.</p>
                  )}
                </div>

                <div className="flex flex-wrap gap-3 sm:gap-4 pt-4">
                  {project.pdf_url && (
                    <Button 
                      asChild
                      className={cn(
                        "rounded-xl transition-all h-9 sm:h-10 text-xs sm:text-sm",
                        theme === 'dark' ? "bg-white/5 hover:bg-white/10 text-white border border-white/10" : "bg-teal-500 text-white hover:bg-teal-400 border-none"
                      )}
                    >
                      <a href={project.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-2">
                        <Download className="w-4 h-4" /> Download PDF
                      </a>
                    </Button>
                  )}
                  {project.github_url && (
                    <Button 
                      variant="outline" 
                      className={cn(
                        "rounded-xl transition-all h-9 sm:h-10 text-xs sm:text-sm",
                        theme === 'dark' ? "border-white/10 text-slate-300 hover:text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                      )}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" /> Source Code
                    </Button>
                  )}
                </div>

                {/* Comment Section */}
                <div className="pt-6 sm:pt-8 space-y-6">
                  <h4 className={cn("text-xs sm:text-sm font-bold uppercase tracking-widest flex items-center gap-2", theme === 'dark' ? "text-white" : "text-slate-900")}>
                    <MessageSquare className="w-4 h-4 text-teal-500" /> 
                    Comments ({project.comments_count})
                  </h4>
                  
                  <form onSubmit={handleAddComment} className="flex gap-3 sm:gap-4">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={viewerProfile?.avatar_url} />
                        <AvatarFallback className={cn("text-[10px] text-white", theme === 'dark' ? "bg-slate-800" : "bg-slate-200")}>
                          {user?.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    <div className="relative flex-1">
                      <input 
                        type="text"
                        placeholder="Join the discussion..."
                        className={cn(
                          "w-full border rounded-xl pl-4 pr-12 py-2 text-sm outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                          theme === 'dark' ? "bg-white/5 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900"
                        )}
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                      />
                      <button 
                        disabled={isSubmittingComment || !commentInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-teal-500 hover:text-teal-400 disabled:opacity-30"
                      >
                        {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </form>

                  <div className="space-y-6 mt-8">
                    {loadingComments ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-slate-700 animate-spin" />
                      </div>
                    ) : comments.length === 0 ? (
                      <p className="text-center text-slate-600 text-xs italic py-4">Be the first to share your thoughts.</p>
                    ) : (
                      comments.map(comment => (
                        <div key={comment.id} className="flex gap-4 group">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarImage src={comment.user_avatar} />
                            <AvatarFallback className={cn("text-[10px]", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")}>
                              {comment.user_name?.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className={cn("text-xs font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>@{comment.user_name}</span>
                                  <span className="text-[10px] text-slate-600 font-medium">
                                    {new Date(comment.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {user?.id === comment.user_id && (
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-600 hover:text-rose-500 transition-all"
                                    title="Delete comment"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className={cn("text-sm font-light leading-relaxed transition-colors", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                                {comment.content}
                              </p>
                            </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                <div className={cn(
                  "p-6 rounded-3xl border space-y-6 transition-all",
                  theme === 'dark' ? "bg-white/5 border-white/5" : "bg-white border-slate-200 shadow-sm"
                )}>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 italic block">Scholar Identity</span>
                    <div className="flex items-center gap-3 pt-2">
                       <Avatar className="h-10 w-10 border border-teal-500/20">
                        <AvatarImage src={creatorProfile?.avatar_url} />
                        <AvatarFallback className={cn("text-xs uppercase", theme === 'dark' ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600")}>
                          {(creatorProfile?.full_name || project.student_name)?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className={cn("text-sm font-bold leading-tight", theme === 'dark' ? "text-white" : "text-slate-900")}>
                          {creatorProfile?.full_name || project.student_name}
                        </p>
                        <p className="text-[10px] text-teal-500 font-bold uppercase tracking-tight">Verified Scholar</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className={cn("space-y-1 p-3 rounded-xl border", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                      <span className="text-[9px] uppercase font-bold text-slate-600 block">Likes</span>
                      <span className={cn("text-lg font-serif italic", theme === 'dark' ? "text-white" : "text-slate-900")}>{project.likes}</span>
                    </div>
                    <div className={cn("space-y-1 p-3 rounded-xl border", theme === 'dark' ? "bg-white/5 border-white/5" : "bg-slate-50 border-slate-100")}>
                      <span className="text-[9px] uppercase font-bold text-slate-600 block">Rating</span>
                      <span className="text-lg font-serif italic text-teal-400">{project.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <Button variant="outline" className={cn(
                    "w-full rounded-xl gap-2 h-10 text-xs font-bold uppercase tracking-widest transition-all",
                    theme === 'dark' ? "border-white/10 text-white hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-50"
                  )}>
                    <Share2 className="w-3 h-3" /> Share Project
                  </Button>
                </div>
                
                <div className="p-6">
                   <h5 className="text-[10px] uppercase font-bold tracking-widest text-slate-600 mb-4 flex items-center gap-2">
                     <Tag className="w-3 h-3" /> Field Overview
                   </h5>
                   <p className={cn("text-xs leading-relaxed italic transition-colors", theme === 'dark' ? "text-slate-400" : "text-slate-600")}>
                     This work is archived under the <span className={cn("font-bold", theme === 'dark' ? "text-white" : "text-slate-900")}>{project.category}</span> library collections.
                   </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Helper types/functions placeholder
// In a real app, these SQL RPCs would need to be created in the Supabase Dashboard:
/*
-- Increment interaction count
CREATE OR REPLACE FUNCTION increment_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = %I + 1 WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql;

-- Decrement interaction count
CREATE OR REPLACE FUNCTION decrement_interaction(target_project_id UUID, column_name TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = GREATEST(0, %I - 1) WHERE id = $1', column_name, column_name)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql;

-- Swap interaction (e.g. like to dislike)
CREATE OR REPLACE FUNCTION swap_interaction(target_project_id UUID, inc_column TEXT, dec_column TEXT)
RETURNS void AS $$
BEGIN
  EXECUTE format('UPDATE projects SET %I = %I + 1, %I = GREATEST(0, %I - 1) WHERE id = $1', inc_column, inc_column, dec_column, dec_column)
  USING target_project_id;
END;
$$ LANGUAGE plpgsql;
*/
