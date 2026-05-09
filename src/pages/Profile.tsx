import * as React from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { useAuth } from '../components/AuthProvider';
import { motion, AnimatePresence } from 'motion/react';
import { SessionNavBar } from '../components/ui/sidebar';
import { 
  Camera, 
  Mail, 
  User, 
  Briefcase, 
  Users, 
  MapPin, 
  Link as LinkIcon, 
  Edit3, 
  Check, 
  X,
  Loader2,
  ChevronRight,
  Book,
  Plus
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

export function Profile() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedProfile, setEditedProfile] = React.useState<Partial<UserProfile>>({});
  const [projectCount, setProjectCount] = React.useState(0);
  const [followersCount, setFollowersCount] = React.useState(0); 
  const [saving, setSaving] = React.useState(false);
  const [dbSetupRequired, setDbSetupRequired] = React.useState(false);
  const [storageSetupRequired, setStorageSetupRequired] = React.useState(false);
  const [locationName, setLocationName] = React.useState<string>("Detecting location...");
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [myProjects, setMyProjects] = React.useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
            .then((res) => res.json())
            .then((data) => {
              setLocationName(
                data.address.city || data.address.town || data.address.village || "Unknown"
              );
            })
            .catch(() => setLocationName("Unknown location"));
        },
        () => setLocationName("Location not available")
      );
    } else {
      setLocationName("Geolocation not supported");
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      fetchProfile();
      fetchProjectCount();
      fetchUserProjects();
    }
  }, [user]);

  const fetchUserProjects = async () => {
    if (!user) return;
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMyProjects(data || []);
    } catch (err) {
      console.error('Error fetching user projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205') {
          setDbSetupRequired(true);
          // Don't throw, just exit and use fallback
          return;
        }
        throw error;
      }

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      } else {
        // Create initial profile if not exists
        const initialProfile = {
          id: user.id,
          username: user.email?.split('@')[0] || 'user',
          full_name: user.email?.split('@')[0] || 'User',
          email: user.email || '',
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('profiles')
          .insert([initialProfile])
          .select()
          .single();
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          // Fallback for initial UI
          setProfile(initialProfile as UserProfile);
          setEditedProfile(initialProfile as UserProfile);
        } else {
          setProfile(newData);
          setEditedProfile(newData);
        }
      }
    } catch (error: any) {
      console.warn('Profile fetch handled (missing table or connection):', error.message);
      // Construct a minimal profile so the UI doesn't break
      const fallbackProfile = {
        id: user.id,
        username: user.email?.split('@')[0] || 'user',
        full_name: user.email?.split('@')[0] || 'User',
        email: user.email || '',
        bio: error.message?.includes('PGRST205') || error.message?.includes('profiles') 
          ? '⚠️ Warning: Profiles table not found. Please run the SQL setup script in Supabase.'
          : ''
      };
      setProfile(fallbackProfile as UserProfile);
      setEditedProfile(fallbackProfile as UserProfile);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCount = async () => {
    if (!user) return;
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', user.id);

      if (error) {
        if (error.code === 'PGRST205') {
          setDbSetupRequired(true);
          setProjectCount(0);
          return;
        }
        throw error;
      }
      setProjectCount(count || 0);
    } catch (error) {
      console.error('Error fetching project count:', error);
      setProjectCount(0);
    }
  };

  const handleSave = async () => {
    if (!user || !profile) return;
    try {
      setSaving(true);
      let updatedAvatarUrl = profile.avatar_url;

      // Handle file upload if a new file was selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, selectedFile);

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          if (uploadError.message.toLowerCase().includes('bucket not found')) {
            setStorageSetupRequired(true);
            throw new Error('Storage bucket "avatars" not found.');
          }
          throw uploadError;
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);
          
          updatedAvatarUrl = publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          ...editedProfile,
          avatar_url: updatedAvatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...editedProfile, avatar_url: updatedAvatarUrl } as UserProfile);
      setPreviewUrl(null);
      setSelectedFile(null);
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarIconClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const updateSingleField = async (field: keyof UserProfile, value: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user.id);
      if (error) throw error;
      if (profile) setProfile({ ...profile, [field]: value });
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    }
  };

  if (loading) {
    return (
      <div className={cn(
        "flex min-h-screen w-full items-center justify-center transition-colors duration-500",
        theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
      )}>
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className="relative flex flex-1 flex-col md:pl-[4.5rem] pb-20 md:pb-0">
        {/* DB Setup Warning Banner */}
        <AnimatePresence>
          {(dbSetupRequired || storageSetupRequired) && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-500/10 border-b border-amber-500/20 px-6 py-3 flex items-center justify-between gap-4 z-50 sticky top-0 backdrop-blur-md"
            >
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 text-lg font-bold">
                  !
                </div>
                <p className="text-sm font-medium text-amber-200">
                  {storageSetupRequired ? (
                    <>
                      <span className="font-bold">Storage Bucket Required:</span> The bucket "avatars" was not found. Please create it in your Supabase Storage dashboard.
                    </>
                  ) : (
                    <>
                      <span className="font-bold">Database Setup Required:</span> Tables "profiles" or "projects" were not found in your Supabase schema.
                    </>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="border-amber-500/50 text-amber-500 hover:bg-amber-500 hover:text-white"
                  onClick={() => {
                    const msg = storageSetupRequired 
                      ? '1. Go to Supabase Storage\n2. Create a "Public" bucket named "avatars"\n3. Add an "Insert" policy for authenticated users'
                      : 'Please copy and run the code in "supabase-setup.sql" in your Supabase SQL Editor.';
                    alert(msg);
                  }}
                >
                  How to fix
                </Button>
                <button 
                  onClick={() => {
                    setDbSetupRequired(false);
                    setStorageSetupRequired(false);
                  }} 
                  className="text-amber-500/50 hover:text-amber-500 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header Background */}
        <div className={cn(
          "h-64 w-full relative overflow-hidden transition-colors",
          theme === 'dark' ? "bg-gradient-to-r from-slate-900 to-slate-950" : "bg-gradient-to-r from-teal-50 to-slate-100"
        )}>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className={cn(
            "absolute inset-0 bg-gradient-to-b transition-colors",
            theme === 'dark' ? "from-transparent to-slate-950" : "from-transparent to-slate-50"
          )}></div>
        </div>

        <main className="relative z-10 -mt-32 px-4 py-8 sm:px-6 lg:px-12 max-w-5xl mx-auto w-full">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "backdrop-blur-xl border rounded-3xl p-8 shadow-2xl relative transition-all duration-300",
              theme === 'dark' ? "bg-slate-900/50 border-white/5" : "bg-white/80 border-slate-200"
            )}
          >
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-end">
              {/* Avatar section */}
              <div className="relative group">
                <Avatar className={cn(
                  "h-40 w-40 border-4 shadow-xl ring-2 ring-teal-500/20",
                  theme === 'dark' ? "border-slate-950" : "border-white"
                )}>
                  <AvatarImage src={previewUrl || profile?.avatar_url} />
                  <AvatarFallback className="bg-slate-800 text-6xl text-teal-500 font-serif lowercase italic">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />

                <button 
                  onClick={handleAvatarIconClick}
                  className="absolute bottom-2 right-2 p-2 bg-teal-500 rounded-full text-white shadow-lg shadow-teal-500/40 hover:scale-110 active:scale-95 transition-all"
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Main info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                  {isEditing ? (
                    <input 
                      type="text"
                      className={cn(
                        "rounded-lg px-4 py-2 text-3xl font-serif italic outline-none focus:ring-2 focus:ring-teal-500/50 transition-all",
                        theme === 'dark' ? "bg-white/5 border border-white/10 text-white" : "bg-slate-50 border border-slate-200 text-slate-900"
                      )}
                      value={editedProfile.full_name || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      autoFocus
                    />
                  ) : (
                    <h1 className={cn(
                      "text-4xl font-serif italic transition-colors",
                      theme === 'dark' ? "text-white" : "text-slate-900"
                    )}>
                      {profile?.full_name || 'Anonymous User'}
                    </h1>
                  )}
                  
                  <div className="flex justify-center md:justify-start gap-2">
                    {(isEditing || previewUrl) ? (
                      <>
                        <button 
                          onClick={handleSave}
                          disabled={saving}
                          className="p-2 bg-teal-500 rounded-lg text-white hover:bg-teal-400 transition-all disabled:opacity-50"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => {
                            setIsEditing(false);
                            setPreviewUrl(null);
                            setSelectedFile(null);
                            setEditedProfile(profile || {});
                          }}
                          className={cn(
                            "p-2 rounded-lg transition-all",
                            theme === 'dark' ? "bg-white/5 text-white hover:bg-white/10" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          )}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <button 
                        onClick={() => setIsEditing(true)}
                        className={cn(
                          "p-2 rounded-lg transition-all",
                          theme === 'dark' ? "bg-white/5 text-slate-400 hover:text-white hover:bg-white/10" : "bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200"
                        )}
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <p className={cn(
                  "font-medium tracking-wide flex items-center justify-center md:justify-start gap-2 mb-4 transition-colors",
                  theme === 'dark' ? "text-teal-400" : "text-teal-600"
                )}>
                  <Mail className="w-4 h-4" />
                  {profile?.email}
                </p>

                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm">
                  <div className="flex flex-col items-center md:items-start">
                    <span className={cn("font-bold text-xl", theme === 'dark' ? "text-white" : "text-slate-900")}>{projectCount}</span>
                    <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Projects</span>
                  </div>
                  <div className={cn("h-8 w-[1px] mx-2 hidden sm:block", theme === 'dark' ? "bg-white/5" : "bg-slate-200")} />
                  <div className="flex flex-col items-center md:items-start">
                    <span className={cn("font-bold text-xl", theme === 'dark' ? "text-white" : "text-slate-900")}>{followersCount}</span>
                    <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Followers</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section */}
            <div className={cn("mt-12 border-t pt-8 transition-colors", theme === 'dark' ? "border-white/5" : "border-slate-100")}>
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                <User className="w-3 h-3" /> About Me
              </h3>
              {isEditing ? (
                <textarea 
                  className={cn(
                    "w-full rounded-xl p-4 transition-all outline-none focus:ring-2 focus:ring-teal-500/50 min-h-[100px]",
                    theme === 'dark' ? "bg-white/5 border border-white/10 text-slate-300" : "bg-slate-50 border border-slate-200 text-slate-700"
                  )}
                  value={editedProfile.bio || ''}
                  onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <div className="group flex flex-col items-start gap-3">
                  <p className={cn(
                    "leading-relaxed font-light italic transition-colors",
                    theme === 'dark' ? "text-slate-300" : "text-slate-600",
                    !profile?.bio && "text-slate-500"
                  )}>
                    {profile?.bio || 'You haven\'t added a bio yet. Click the edit icon or "Add bio" below to tell the world about your academic journey.'}
                  </p>
                  {!profile?.bio && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditing(true)}
                      className="text-teal-500 hover:text-teal-400 p-0 h-auto font-medium flex items-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add bio
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            {/* Additional details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group hover:shadow-md",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-white"
              )}>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Location</span>
                  <span className={cn("text-sm transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{locationName}</span>
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group hover:shadow-md",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-white"
              )}>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Role</span>
                  <span className={cn("text-sm transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>Undergraduate Scholar</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Activity / Tabs Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className={cn(
                "text-2xl font-serif italic flex items-center gap-3 transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                My Archive
                <div className={cn("h-[1px] flex-1 bg-gradient-to-r", theme === 'dark' ? "from-white/10 to-transparent" : "from-slate-200 to-transparent")} />
              </h2>
              
              {loadingProjects ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
                </div>
              ) : myProjects.length === 0 ? (
                <div className={cn(
                  "backdrop-blur-sm border p-12 rounded-2xl text-center transition-colors",
                  theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200"
                )}>
                  <p className="text-slate-500 italic">No projects submitted yet.</p>
                  <Button variant="link" className="mt-2 text-teal-500" onClick={() => navigate('/upload-project')}>
                    Submit your first project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {myProjects.map((project) => (
                    <motion.div 
                      key={project.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={cn(
                        "group p-6 rounded-2xl border transition-all flex items-center justify-between",
                        theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-white border-slate-200 hover:shadow-md hover:border-teal-500/20"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-500">
                          <Book className="w-6 h-6" />
                        </div>
                        <div>
                          <h4 className={cn("font-medium group-hover:text-teal-400 transition-colors", theme === 'dark' ? "text-white" : "text-slate-900")}>{project.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] uppercase font-bold text-slate-500">{project.category}</span>
                            <span className="text-slate-400">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {new Date(project.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => navigate('/projects')}
                        className="text-slate-500 hover:text-teal-500"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-6">
              <h2 className={cn(
                "text-2xl font-serif italic flex items-center gap-3 transition-colors",
                theme === 'dark' ? "text-white" : "text-slate-900"
              )}>
                Connections
                <div className={cn("h-[1px] flex-1 bg-gradient-to-r", theme === 'dark' ? "from-white/10 to-transparent" : "from-slate-200 to-transparent")} />
              </h2>
              
              <div className={cn(
                "backdrop-blur-sm border p-6 rounded-2xl transition-colors",
                theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"
              )}>
                 <p className="text-sm text-slate-500 text-center italic">No followers yet.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
