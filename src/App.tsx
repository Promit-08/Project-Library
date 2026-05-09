import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './components/AuthProvider';
import { cn } from './lib/utils';
import { Login } from './pages/Login';
import { Home } from './pages/Home';
import { Profile } from './pages/Profile';
import { UploadProject } from './pages/UploadProject';
import { Projects } from './pages/Projects';
import { Notifications } from './pages/Notifications';
import { ProjectResearch } from './pages/ProjectResearch';

import { ThemeProvider, useTheme } from './components/ThemeProvider';
import { Settings as SettingsPage } from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  
  if (loading) return (
    <div className={cn(
      "flex min-h-screen items-center justify-center",
      theme === 'dark' ? "bg-slate-950" : "bg-slate-50"
    )}>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppContent() {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';
  const { theme } = useTheme();

  return (
    <div className={cn(
      "min-h-screen font-sans transition-colors duration-500",
      theme === 'dark' 
        ? (isLoginPage ? "bg-slate-900" : "bg-slate-950")
        : (isLoginPage ? "bg-slate-100" : "bg-slate-50")
    )}>
      <main className="w-full">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute>
              <UploadProject />
            </ProtectedRoute>
          } />
          <Route path="/projects" element={
            <ProtectedRoute>
              <Projects />
            </ProtectedRoute>
          } />
          <Route path="/notifications" element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } />
          <Route path="/research" element={
            <ProtectedRoute>
              <ProjectResearch />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
