
'use client';

import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

// Initialize client-side supabase
// We use the env vars directly as we don't have the wrapper in components yet
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AuthButton() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithTwitch = async () => {
    // Determine the base URL for redirection
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || window.location.origin;
    
    await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: {
        redirectTo: `${baseUrl}/auth/callback`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (user) {
    return (
      <div className="flex items-center gap-4">
        <div className="flex flex-col items-end">
           <span className="text-sm font-medium text-green-100">
             {user.user_metadata?.full_name || user.user_metadata?.name || 'Player'}
           </span>
           <span className="text-[10px] text-green-100/50 uppercase tracking-widest">
             Logged In
           </span>
        </div>
        {user.user_metadata?.avatar_url && (
            <img 
              src={user.user_metadata.avatar_url} 
              alt="Avatar" 
              className="w-8 h-8 rounded-full border border-green-500/30"
            />
        )}
        <button 
          onClick={signOut}
          className="text-xs px-3 py-1 rounded-full border border-green-500/30 hover:bg-green-500/10 transition-colors text-green-100/70"
        >
          Sign Out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={signInWithTwitch}
      className="flex items-center gap-2 px-4 py-2 bg-[#6441a5] hover:bg-[#7d5bbe] text-white rounded-lg transition-colors text-sm font-medium shadow-lg hover:shadow-[#6441a5]/20"
    >
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h2.998L24 10.286V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>
      Sign in with Twitch
    </button>
  );
}
