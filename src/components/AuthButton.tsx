'use client';

import { createBrowserClient } from '@supabase/ssr';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthButtonProps {
  user: User | null;
}

export default function AuthButton({ user: initialUser }: AuthButtonProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);

  // Initialize client once per component mount
  const [supabase] = useState(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ));

  useEffect(() => {
    console.log('[AuthButton] Mounted with initial user:', initialUser?.id);
    let mounted = true;

    if (!initialUser) {
      setLoading(true);
      supabase.auth.getSession().then(({ data: { session }, error }) => {
        if (!mounted) return;
        if (session?.user) {
          console.log('[AuthButton] Session recovered client-side:', session.user.id);
          setUser(session.user);
        } else if (error) {
          console.error('[AuthButton] Session recovery failed:', error);
        }
        setLoading(false);
      });
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthButton] Auth state change:', event, session?.user?.id);
      if (mounted) {
        setUser(session?.user ?? null);
        if (event === 'SIGNED_OUT') {
           router.refresh();
        }
      }
    });

    return () => {
      console.log('[AuthButton] Unmounting');
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router, initialUser]);

  const signInWithTwitch = async () => {
    console.log('[AuthButton] Initiating Twitch sign-in...');
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL;
      console.log('[AuthButton] Redirect URL:', `${baseUrl}/auth/callback`);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'twitch',
        options: {
          redirectTo: `${baseUrl}/auth/callback`,
        },
      });
      if (error) {
          console.error('[AuthButton] Sign-in error:', error);
          throw error;
      }
    } catch (error) {
      console.error('[AuthButton] Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };

  const signOut = async () => {
    console.log('[AuthButton] Signing out...');
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  if (loading) {
    return <div className="h-8 w-24 bg-white/5 rounded animate-pulse" />;
  }

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
            // eslint-disable-next-line @next/next/no-img-element
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
      className="flex items-center gap-2 px-4 py-2 bg-[#6441a5] hover:bg-[#7d5bbe] text-white rounded-full transition-colors font-medium text-sm shadow-lg shadow-purple-900/20"
    >
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h2.998L24 10.286V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V2.571h13.714z"/>
      </svg>
      Sign in with Twitch
    </button>
  );
}
