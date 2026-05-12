import * as React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Youtube, Play, Loader2, Info, ArrowRight, ExternalLink, Video } from 'lucide-react';
import { cn } from '../lib/utils';
import { useTheme } from '../components/ThemeProvider';
import { Button } from '../components/ui/button';
import { SessionNavBar } from '../components/ui/sidebar';

interface YouTubeVideo {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
    };
    channelTitle: string;
    publishedAt: string;
  };
}

export function ProjectResearch() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = React.useState('');
  const [videos, setVideos] = React.useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedVideo, setSelectedVideo] = React.useState<YouTubeVideo | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const API_KEY = (import.meta as any).env.VITE_YOUTUBE_API_KEY;

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    if (!API_KEY) {
      setError("YouTube API Key is missing. Please add VITE_YOUTUBE_API_KEY to your environment settings.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=12&q=${encodeURIComponent(searchQuery + ' project research tutorial')}&type=video&key=${API_KEY}`
      );
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      setVideos(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch videos. Please check your API key or try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      {/* Sidebar */}
      <SessionNavBar />

      <div className="relative flex flex-1 flex-col lg:pl-[4.5rem] pb-20 lg:pb-0">
        <div className="p-4 sm:p-8 lg:p-12 pb-24">
          <header className="max-w-6xl mx-auto mb-12">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="bg-teal-500/20 p-2 rounded-xl">
                <Video className="w-6 h-6 text-teal-400" />
              </div>
              <h1 className={cn(
                "text-3xl font-bold tracking-tight",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>Project Research</h1>
            </motion.div>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-slate-500 max-w-2xl mb-8"
            >
              Explore thousands of project tutorials, case studies, and research videos directly from YouTube to inspire your next big breakthrough.
            </motion.p>
    
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              onSubmit={handleSearch}
              className="relative group max-w-2xl"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-teal-500 transition-colors z-10" />
              <input 
                type="text"
                placeholder="Search for projects (e.g., 'Smart Home IoT', 'React CRM System')..."
                className={cn(
                  "w-full border rounded-2xl pl-12 pr-32 py-4 outline-none focus:ring-2 focus:ring-teal-500/50 transition-all shadow-xl text-base",
                  theme === 'dark' 
                    ? "bg-slate-900 border-white/10 text-white placeholder:text-slate-600 focus:bg-slate-800" 
                    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Button 
                  type="submit"
                  disabled={loading}
                  className="rounded-xl bg-teal-500 text-white hover:bg-teal-600 px-6 h-10 text-xs font-bold uppercase tracking-widest transition-all"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Search"}
                </Button>
              </div>
            </motion.form>
          </header>
    
          <main className="max-w-6xl mx-auto">
            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-6 rounded-2xl flex items-start gap-4"
              >
                <Info className="w-6 h-6 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold mb-1">Search Error</p>
                  <p className="text-sm opacity-80">{error}</p>
                </div>
              </motion.div>
            )}
    
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {videos.map((video, idx) => (
                  <motion.div
                    key={video.id.videoId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ y: -5 }}
                    className={cn(
                      "group rounded-3xl overflow-hidden border transition-all cursor-pointer",
                      theme === 'dark' ? "bg-slate-900/50 border-white/5 hover:border-white/10" : "bg-white border-slate-200 shadow-sm hover:shadow-md"
                    )}
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="aspect-video relative overflow-hidden">
                      <img 
                        src={video.snippet.thumbnails.high.url} 
                        alt={video.snippet.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="bg-teal-500 p-4 rounded-full scale-75 group-hover:scale-100 transition-transform">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className={cn(
                        "font-bold text-sm mb-2 line-clamp-2 leading-snug",
                        theme === 'dark' ? "text-teal-100" : "text-slate-900"
                      )} dangerouslySetInnerHTML={{ __html: video.snippet.title }} />
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                        <Youtube className="w-3 h-3 text-red-500" />
                        {video.snippet.channelTitle}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
    
            {!loading && videos.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="bg-white/5 p-6 rounded-full mb-6">
                  <Youtube className="w-12 h-12 text-slate-700" />
                </div>
                <h3 className={cn(
                  "text-lg font-bold mb-2",
                  theme === 'dark' ? "text-slate-400" : "text-slate-600"
                )}>Ready to Research?</h3>
                <p className="text-slate-500 max-w-sm text-sm">
                  Enter keywords above to find relevant project videos and technical documentation.
                </p>
              </div>
            )}
          </main>
    
          {/* Video Player Modal */}
          <AnimatePresence>
            {selectedVideo && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-slate-950/90 backdrop-blur-md"
                onClick={() => setSelectedVideo(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className={cn(
                    "w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative",
                    theme === 'dark' ? "bg-slate-900" : "bg-white"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="aspect-video w-full">
                    <iframe
                      src={`https://www.youtube.com/embed/${selectedVideo.id.videoId}?autoplay=1`}
                      className="w-full h-full border-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  </div>
                  <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 items-start justify-between">
                    <div className="flex-1">
                      <h2 className={cn(
                        "text-xl md:text-2xl font-bold mb-4",
                        theme === 'dark' ? "text-white" : "text-slate-900"
                      )} dangerouslySetInnerHTML={{ __html: selectedVideo.snippet.title }} />
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Youtube className="w-4 h-4 text-red-500" />
                          {selectedVideo.snippet.channelTitle}
                        </span>
                        <span className="h-4 w-px bg-slate-800 hidden md:block"></span>
                        <span>{new Date(selectedVideo.snippet.publishedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button 
                        onClick={() => setSelectedVideo(null)}
                        variant="outline"
                        className="rounded-xl border-white/10 hover:bg-white/5"
                      >
                        Close
                      </Button>
                      <Button 
                        className="bg-teal-500 hover:bg-teal-600 rounded-xl"
                        onClick={() => window.open(`https://www.youtube.com/watch?v=${selectedVideo.id.videoId}`, '_blank')}
                      >
                        Watch on YouTube <ExternalLink className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
