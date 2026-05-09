import * as React from "react";
import { cn } from "../../lib/utils";
import { ScrollArea } from "./scroll-area";
import { motion } from "motion/react";
import { Badge } from "./badge";
import {
  Blocks,
  ChevronsUpDown,
  Home,
  FolderKanban,
  Upload,
  LogOut,
  Plus,
  Settings,
  UserCircle,
  UserCog,
  Bell,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./avatar";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Separator } from "./separator";
import { useAuth } from "../AuthProvider";
import { supabase, UserProfile } from "../../lib/supabase";

const sidebarVariants = {
  open: {
    width: "15rem",
  },
  closed: {
    width: "4.5rem",
  },
};

const variants = {
  open: {
    x: 0,
    opacity: 1,
    transition: {
      x: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    x: -20,
    opacity: 0,
    transition: {
      x: { stiffness: 100 },
    },
  },
};

const transitionProps = {
  type: "tween",
  ease: "easeOut",
  duration: 0.2,
};

const staggerVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.02 },
  },
};

import { useTheme } from "../ThemeProvider";

export function SessionNavBar() {
  const [isCollapsed, setIsCollapsed] = React.useState(true);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const { theme } = useTheme();
  const location = useLocation();
  const { user } = useAuth();
  const pathname = location.pathname;

  React.useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchProfile();
      
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            fetchUnreadCount();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchUnreadCount = async () => {
    if (!user) return;
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    
    if (!error) {
      setUnreadCount(count || 0);
    }
  };

  const fetchProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";
  const userEmail = user?.email || "user@example.com";
  const userName = user?.email?.split('@')[0] || "User";

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.div
        className={cn(
          "sidebar fixed left-0 z-40 h-full shrink-0 border-r backdrop-blur-xl transition-all duration-500 hidden md:block",
          theme === 'dark' 
            ? "border-white/5 bg-slate-950/50 text-slate-400" 
            : "border-slate-200 bg-white/80 text-slate-500"
        )}
        initial={isCollapsed ? "closed" : "open"}
        animate={isCollapsed ? "closed" : "open"}
        variants={sidebarVariants}
        transition={transitionProps}
        onMouseEnter={() => setIsCollapsed(false)}
        onMouseLeave={() => setIsCollapsed(true)}
      >
        <div className="flex h-full flex-col">
          {/* Header / Logo */}
          <div className={cn(
            "flex h-16 w-full shrink-0 items-center border-b p-4 transition-colors",
            theme === 'dark' ? "border-white/5" : "border-slate-100"
          )}>
            <div className="flex w-full items-center justify-start gap-3 px-1">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-teal-500 text-white shadow-lg shadow-teal-500/20">
                <span className="text-xs font-bold transition-colors">PL</span>
              </div>
              {!isCollapsed && (
                <motion.div 
                  variants={variants}
                  className="flex flex-1 items-center justify-between overflow-hidden"
                >
                  <span className={cn(
                    "truncate text-sm font-semibold transition-colors",
                    theme === 'dark' ? "text-white" : "text-slate-900"
                  )}>Project Library</span>
                </motion.div>
              )}
            </div>
          </div>

          {/* Main Nav */}
          <div className="flex flex-1 flex-col overflow-hidden">
            <ScrollArea className="flex-1 px-3 py-4">
              <motion.div variants={staggerVariants} className="flex flex-col gap-1">
                <Link
                  to="/"
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                    pathname === "/" 
                      ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                      : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  )}
                >
                  <Home className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="text-sm font-medium">Home</motion.span>
                  )}
                </Link>

                <Link
                  to="/projects"
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                    pathname.startsWith("/projects") 
                      ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                      : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  )}
                >
                  <FolderKanban className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="text-sm font-medium">Projects</motion.span>
                  )}
                </Link>

                <Link
                  to="/research"
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                    pathname === "/research" 
                      ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                      : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  )}
                >
                  <Video className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <motion.span variants={variants} className="text-sm font-medium">Project Research</motion.span>
                  )}
                </Link>

                <Link
                  to="/upload"
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                    pathname === "/upload" 
                      ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                      : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  )}
                >
                  <Upload className="h-5 w-5 shrink-0" />
                  {!isCollapsed && (
                    <motion.div variants={variants} className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium">Upload Projects</span>
                    </motion.div>
                  )}
                </Link>

                <Link
                  to="/notifications"
                  className={cn(
                    "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200 relative",
                    pathname === "/notifications" 
                      ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                      : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
                  )}
                >
                  <div className="relative">
                    <Bell className="h-5 w-5 shrink-0" />
                    {isCollapsed && unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-3 w-3 items-center justify-center rounded-full bg-teal-500 text-[7px] font-bold text-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <motion.div variants={variants} className="flex flex-1 items-center justify-between">
                      <span className="text-sm font-medium">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge className="bg-teal-500 text-white border-none py-0 px-1.5 h-4 min-w-[1rem] flex items-center justify-center text-[10px] animate-pulse">
                          {unreadCount}
                        </Badge>
                      )}
                    </motion.div>
                  )}
                </Link>
              </motion.div>
            </ScrollArea>
          </div>

          {/* Bottom Section */}
          <div className={cn(
            "mt-auto flex flex-col border-t p-3 gap-1 transition-colors",
            theme === 'dark' ? "border-white/5" : "border-slate-100"
          )}>
            <Link
              to="/settings"
              className={cn(
                "flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                pathname === "/settings" 
                  ? (theme === 'dark' ? "bg-teal-500/10 text-teal-400" : "bg-teal-50/80 text-teal-600 scale-[1.02] shadow-sm") 
                  : (theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")
              )}
            >
              <Settings className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <motion.span variants={variants} className="text-sm font-medium">Settings</motion.span>
              )}
            </Link>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className={cn(
                  "group flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-200",
                  theme === 'dark' ? "text-slate-400 hover:bg-white/5 hover:text-white" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                )}>
                  <Avatar className="h-6 w-6 border border-white/10 ring-2 ring-teal-500/20">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-slate-800 text-[10px] text-white transition-colors">{userInitial}</AvatarFallback>
                  </Avatar>
                  {!isCollapsed && (
                    <motion.div 
                      variants={variants}
                      className="flex flex-1 items-center justify-between overflow-hidden"
                    >
                      <span className="truncate text-sm font-medium transition-colors">Account</span>
                      <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 group-hover:opacity-100 transition-opacity" />
                    </motion.div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" sideOffset={12} className={cn(
                "w-64 p-2 transition-colors duration-300",
                theme === 'dark' ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-xl"
              )}>
                <div className="flex items-center gap-3 p-2">
                  <Avatar className="h-10 w-10 border border-white/10">
                    {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                    <AvatarFallback className="bg-teal-500 text-white font-bold transition-colors">{userInitial}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-semibold transition-colors">{profile?.full_name || userName}</span>
                    <span className={cn("truncate text-xs transition-colors", theme === 'dark' ? "text-slate-400" : "text-slate-500")}>{userEmail}</span>
                  </div>
                </div>
                <DropdownMenuSeparator className={theme === 'dark' ? "bg-white/5" : "bg-slate-100"} />
                <DropdownMenuItem asChild className={cn(
                  "gap-2 cursor-pointer py-2 transition-colors",
                  theme === 'dark' ? "focus:bg-white/5 focus:text-white" : "focus:bg-slate-50 focus:text-slate-900"
                )}>
                  <Link to="/profile" className="flex items-center gap-2 w-full">
                    <UserCircle className="h-4 w-4" /> Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2 focus:bg-rose-500/10 focus:text-rose-400 cursor-pointer py-2 text-rose-500 transition-colors" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </motion.div>

      {/* Mobile Bottom Nav */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-50 flex h-16 w-full items-center justify-around border-t px-2 md:hidden transition-all duration-300",
        theme === 'dark' 
          ? "bg-slate-950/90 border-white/5 backdrop-blur-lg" 
          : "bg-white/90 border-slate-200 backdrop-blur-lg shadow-[0_-4px_10px_rgba(0,0,0,0.05)]"
      )}>
        <Link 
          to="/" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200",
            pathname === "/" ? "text-teal-500" : "text-slate-400"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>
        <Link 
          to="/projects" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200",
            pathname.startsWith("/projects") ? "text-teal-500" : "text-slate-400"
          )}
        >
          <FolderKanban className="h-5 w-5" />
          <span className="text-[10px] font-medium">Explore</span>
        </Link>
        <Link 
          to="/upload" 
          className={cn(
            "flex h-12 w-12 -translate-y-4 items-center justify-center rounded-full bg-teal-500 text-white shadow-lg shadow-teal-500/40 ring-4",
            theme === 'dark' ? "ring-slate-950" : "ring-white"
          )}
        >
          <Plus className="h-6 w-6" />
        </Link>
        <Link 
          to="/research" 
          className={cn(
            "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200",
            pathname === "/research" ? "text-teal-500" : "text-slate-400"
          )}
        >
          <Video className="h-5 w-5" />
          <span className="text-[10px] font-medium">Videos</span>
        </Link>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <button className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-1.5 transition-all duration-200",
              pathname === "/profile" || pathname === "/settings" ? "text-teal-500" : "text-slate-400"
            )}>
              <Avatar className="h-5 w-5 ring-1 ring-teal-500/50">
                {profile?.avatar_url && <AvatarImage src={profile.avatar_url} />}
                <AvatarFallback className="bg-slate-800 text-[8px] text-white">{userInitial}</AvatarFallback>
              </Avatar>
              <span className="text-[10px] font-medium">Profile</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="center" className={cn(
            "w-56 p-2 transition-colors duration-300",
            theme === 'dark' ? "bg-slate-900 border-white/10 text-white" : "bg-white border-slate-200 text-slate-900 shadow-xl"
          )}>
            <DropdownMenuItem asChild>
              <Link to="/profile" className="flex items-center gap-2 w-full py-2">
                <UserCircle className="h-4 w-4" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="flex items-center gap-2 w-full py-2 relative">
                <Bell className="h-4 w-4" /> Notifications
                {unreadCount > 0 && (
                  <span className="ml-auto bg-teal-500 text-white text-[10px] px-1.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/settings" className="flex items-center gap-2 w-full py-2">
                <Settings className="h-4 w-4" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator className={theme === 'dark' ? "bg-white/5" : "bg-slate-100"} />
            <DropdownMenuItem className="gap-2 text-rose-500" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}
