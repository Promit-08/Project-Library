import React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { AuthComponent } from '../components/ui/sign-up';
import { Gem } from 'lucide-react';

const CustomLogo = () => (
  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-teal-500 text-white shadow-lg shadow-teal-500/20 ring-4 ring-teal-500/10">
    <span className="text-xs font-bold font-sans">PL</span>
  </div>
);

export function Login() {
  const navigate = useNavigate();

  const handleSignUp = async (data: { email: string; password: string }) => {
    const { data: signUpData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        emailRedirectTo: window.location.origin
      }
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('Email already in use')) {
        throw new Error('You already have an account. Please sign in instead.');
      }
      throw error;
    }

    // Handle case where Supabase silently succeeds but user might exist
    // (some configs return empty user if exists but enumeration protection is on)
    if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
      throw new Error('You already have an account. Please sign in instead.');
    }
  };

  const handleSignIn = async (data: { email: string; password: string }) => {
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    if (error) throw error;
    navigate('/');
  };

  return (
    <AuthComponent 
      logo={<CustomLogo />} 
      brandName="Project Library" 
      onSignUp={handleSignUp}
      onSignIn={handleSignIn}
      onSuccess={() => navigate('/')}
    />
  );
}
