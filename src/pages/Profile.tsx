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
  Plus,
  UserPlus,
  UserMinus,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Button } from '../components/ui/button';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

export function Profile() {
  const { user: authUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const { theme } = useTheme();
  
  const targetUserId = userId || authUser?.id;
  const isOwnProfile = !userId || userId === authUser?.id;

  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedProfile, setEditedProfile] = React.useState<Partial<UserProfile>>({});
  const [projectCount, setProjectCount] = React.useState(0);
  const [followersCount, setFollowersCount] = React.useState(0);
  const [followingCount, setFollowingCount] = React.useState(0); 
  const [saving, setSaving] = React.useState(false);
  const [dbSetupRequired, setDbSetupRequired] = React.useState(false);
  const [missingColumns, setMissingColumns] = React.useState<string[]>([]);
  const [storageSetupRequired, setStorageSetupRequired] = React.useState(false);
  const [locationName, setLocationName] = React.useState<string>("Detecting location...");
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [myProjects, setMyProjects] = React.useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = React.useState(false);
  const [connections, setConnections] = React.useState<{ followers: any[], following: any[] }>({ followers: [], following: [] });
  const [loadingConnections, setLoadingConnections] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isOwnProfile && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords({ lat: latitude, lng: longitude });

          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          )
            .then((res) => res.json())
            .then((data) => {
              const loc = data.address.city || data.address.town || data.address.village || "Unknown";
              setLocationName(loc);
              // Auto-update location in profile if it's empty and we are looking at our own
              if (authUser && profile && !profile.location) {
                updateSingleField('location', loc);
              }
            })
            .catch(() => setLocationName("Unknown location"));
        },
        () => setLocationName("Location not available")
      );
    } else if (!isOwnProfile) {
      setLocationName(""); // Clear detection message for other users' profiles
    } else {
      setLocationName("Geolocation not supported");
    }
  }, [isOwnProfile, authUser?.id, !!profile]);

  React.useEffect(() => {
    if (targetUserId) {
      // Reset state for new profile
      setProfile(null);
      setEditedProfile({});
      setProjectCount(0);
      setFollowersCount(0);
      setFollowingCount(0);
      setMyProjects([]);
      setConnections({ followers: [], following: [] });
      setIsFollowing(false);
      setLoading(true);

      fetchProfile();
      fetchProjectCount();
      fetchUserProjects();
      fetchFollowersCount();
      fetchFollowingCount();
      fetchConnections();
      if (!isOwnProfile && authUser) {
        checkIfFollowing();
      }
    }
  }, [targetUserId, authUser?.id]);

  const fetchConnections = async () => {
    if (!targetUserId) return;
    try {
      setLoadingConnections(true);
      
      // Fetch following
      const { data: followingData } = await supabase
        .from('follows')
        .select(`
          followed_id,
          profiles:followed_id (id, full_name, username, avatar_url, university, work, email)
        `)
        .eq('follower_id', targetUserId);

      // Fetch followers
      const { data: followersData } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id (id, full_name, username, avatar_url, university, work, email)
        `)
        .eq('followed_id', targetUserId);

      setConnections({
        following: followingData?.map((f: any) => f.profiles) || [],
        followers: followersData?.map((f: any) => f.profiles) || []
      });
    } catch (err) {
      console.error('Error fetching connections:', err);
    } finally {
      setLoadingConnections(false);
    }
  };

  const checkIfFollowing = async () => {
    if (!authUser || !targetUserId) return;
    const { data } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', authUser.id)
      .eq('followed_id', targetUserId)
      .maybeSingle();
    setIsFollowing(!!data);
  };

  const fetchFollowersCount = async () => {
    if (!targetUserId) return;
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('followed_id', targetUserId);
    setFollowersCount(count || 0);
  };

  const fetchFollowingCount = async () => {
    if (!targetUserId) return;
    const { count } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', targetUserId);
    setFollowingCount(count || 0);
  };

  const toggleFollow = async () => {
    if (!authUser || !targetUserId || isOwnProfile) return;
    try {
      setFollowLoading(true);
      if (isFollowing) {
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', authUser.id)
          .eq('followed_id', targetUserId);
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
      } else {
        await supabase
          .from('follows')
          .insert({ follower_id: authUser.id, followed_id: targetUserId });
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);

        // Notify
        await supabase.from('notifications').insert({
          user_id: targetUserId,
          actor_id: authUser.id,
          type: 'rating',
          content: `${authUser.email?.split('@')[0]} started following you.`
        });
      }
      // Refresh connections list
      fetchConnections();
    } catch (err) {
      console.error('Follow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchUserProjects = async () => {
    if (!targetUserId) return;
    try {
      setLoadingProjects(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('student_id', targetUserId)
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
    if (!targetUserId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .maybeSingle();

      if (error) {
        if (error.code === 'PGRST205') {
          setDbSetupRequired(true);
          return;
        }
        throw error;
      }

      if (data) {
        setProfile(data);
        setEditedProfile(data);
      } else if (isOwnProfile && authUser) {
        // Create initial profile if it's the current user and not found
        const initialProfile = {
          id: authUser.id,
          username: authUser.email?.split('@')[0] || 'user',
          full_name: authUser.email?.split('@')[0] || 'User',
          email: authUser.email || '',
        };
        
        const { data: newData, error: insertError } = await supabase
          .from('profiles')
          .insert([initialProfile])
          .select()
          .single();
        
        if (!insertError && newData) {
          setProfile(newData);
          setEditedProfile(newData);
        } else {
          setProfile(initialProfile as UserProfile);
          setEditedProfile(initialProfile as UserProfile);
        }
      }
    } catch (error: any) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectCount = async () => {
    if (!targetUserId) return;
    try {
      const { count, error } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', targetUserId);

      if (!error) {
        setProjectCount(count || 0);
      }
    } catch (error) {
      console.error('Error fetching project count:', error);
    }
  };

  const handleSave = async () => {
    if (!authUser || !profile) return;
    try {
      setSaving(true);
      let updatedAvatarUrl = profile.avatar_url;

      // Handle file upload if a new file was selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${authUser.id}-${Date.now()}.${fileExt}`;
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
        .eq('id', authUser.id);

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
    if (!authUser) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', authUser.id);
      if (error) {
        if (error.code === 'PGRST204' || error.message?.includes('column')) {
          setMissingColumns(prev => [...new Set([...prev, field as string])]);
          setDbSetupRequired(true);
        }
        throw error;
      }
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

  const userInitial = profile?.email?.charAt(0).toUpperCase() || profile?.full_name?.charAt(0).toUpperCase() || 'U';

  return (
    <div className={cn(
      "flex min-h-screen w-full font-sans transition-colors duration-500",
      theme === 'dark' ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
    )}>
      <SessionNavBar />

      <div className="relative flex flex-1 flex-col lg:pl-[4.5rem] pb-20 lg:pb-0">
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
                  ) : missingColumns.length > 0 ? (
                    <>
                      <span className="font-bold">Database Update Required:</span> Columns <span className="underline">{missingColumns.join(', ')}</span> are missing from your profiles table.
                    </>
                  ) : (
                    <>
                      <span className="font-bold">Database Setup Required:</span> Tables "profiles", "projects" or "follows" were not found or misconfigured in Supabase.
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

                {isOwnProfile && (
                  <button 
                    onClick={handleAvatarIconClick}
                    className="absolute bottom-2 right-2 p-2 bg-teal-500 rounded-full text-white shadow-lg shadow-teal-500/40 hover:scale-110 active:scale-95 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                )}
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
                    {!isOwnProfile && authUser ? (
                      <Button
                        onClick={toggleFollow}
                        disabled={followLoading}
                        className={cn(
                          "rounded-xl px-6 h-10 transition-all shadow-lg min-w-[120px]",
                          isFollowing 
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20" 
                            : "bg-teal-500 hover:bg-teal-600 text-white shadow-teal-500/20"
                        )}
                      >
                        {followLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isFollowing ? (
                          <span className="flex items-center gap-2"><UserMinus className="w-4 h-4" /> Unfollow</span>
                        ) : (
                          <span className="flex items-center gap-2"><UserPlus className="w-4 h-4" /> Follow</span>
                        )}
                      </Button>
                    ) : (
                      <>
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
                      </>
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
                  <div className={cn("h-8 w-[1px] mx-2 hidden sm:block", theme === 'dark' ? "bg-white/5" : "bg-slate-200")} />
                  <div className="flex flex-col items-center md:items-start">
                    <span className={cn("font-bold text-xl", theme === 'dark' ? "text-white" : "text-slate-900")}>{followingCount}</span>
                    <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Following</span>
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
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Location</span>
                  {isEditing ? (
                    <input 
                      className={cn(
                        "text-sm bg-transparent border-none outline-none focus:ring-0 w-full mt-0.5",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                      )}
                      value={editedProfile.location || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, location: e.target.value })}
                      placeholder="City, Country"
                    />
                  ) : (
                    <span className={cn("text-sm transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{profile?.location || locationName}</span>
                  )}
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group hover:shadow-md",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-white"
              )}>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Work / Expertise</span>
                  {isEditing ? (
                    <input 
                      className={cn(
                        "text-sm bg-transparent border-none outline-none focus:ring-0 w-full mt-0.5",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                      )}
                      value={editedProfile.work || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, work: e.target.value })}
                      placeholder="Company or field of work"
                    />
                  ) : (
                    <span className={cn("text-sm transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{profile?.work || 'Scholar'}</span>
                  )}
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-3 p-4 rounded-xl border transition-all duration-300 group hover:shadow-md",
                theme === 'dark' ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-slate-50 border-slate-200 hover:bg-white"
              )}>
                <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500">
                  <Book className="w-4 h-4" />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">University / School</span>
                  {isEditing ? (
                    <input 
                      className={cn(
                        "text-sm bg-transparent border-none outline-none focus:ring-0 w-full mt-0.5",
                        theme === 'dark' ? "text-slate-200" : "text-slate-700"
                      )}
                      value={editedProfile.university || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, university: e.target.value })}
                      placeholder="Name of your university"
                    />
                  ) : (
                    <span className={cn("text-sm transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-700")}>{profile?.university || 'Academic Institution'}</span>
                  )}
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
                "backdrop-blur-sm border p-6 rounded-2xl transition-colors space-y-6",
                theme === 'dark' ? "bg-slate-900/40 border-white/5" : "bg-white border-slate-200 shadow-sm"
              )}>
                {loadingConnections ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Following ({connections.following.length})</h3>
                      {connections.following.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {connections.following.slice(0, 5).map((p) => (
                            <div 
                              key={p.id} 
                              className="flex items-center gap-3 group cursor-pointer"
                              onClick={() => navigate(`/profile/${p.id}`)}
                            >
                              <Avatar className="h-8 w-8 border border-teal-500/10">
                                <AvatarImage src={p.avatar_url} />
                                <AvatarFallback className="bg-slate-800 text-teal-500 text-[10px]">
                                  {(p.email || p.full_name)?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <h4 className={cn("text-xs font-medium truncate group-hover:text-teal-500 transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>
                                  {p.full_name}
                                </h4>
                                <p className="text-[9px] text-slate-500 truncate">{p.university || p.work || 'Scholar'}</p>
                              </div>
                            </div>
                          ))}
                          {connections.following.length > 5 && (
                            <Button variant="link" size="sm" className="p-0 h-auto text-teal-500 text-[10px]" onClick={() => navigate('/connections')}>
                              See all following
                            </Button>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">Not following anyone yet.</p>
                      )}
                    </div>

                    <div className="h-[1px] w-full bg-slate-100 dark:bg-white/5" />

                    <div className="space-y-4">
                      <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500">Followers ({connections.followers.length})</h3>
                      {connections.followers.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {connections.followers.slice(0, 5).map((p) => (
                            <div 
                              key={p.id} 
                              className="flex items-center gap-3 group cursor-pointer"
                              onClick={() => navigate(`/profile/${p.id}`)}
                            >
                              <Avatar className="h-8 w-8 border border-teal-500/10">
                                <AvatarImage src={p.avatar_url} />
                                <AvatarFallback className="bg-slate-800 text-teal-500 text-[10px]">
                                  {(p.email || p.full_name)?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 overflow-hidden">
                                <h4 className={cn("text-xs font-medium truncate group-hover:text-teal-400 transition-colors", theme === 'dark' ? "text-slate-200" : "text-slate-900")}>
                                  {p.full_name}
                                </h4>
                                <p className="text-[9px] text-slate-500 truncate">{p.university || p.work || 'Scholar'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-[10px] text-slate-500 italic">No followers yet.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
