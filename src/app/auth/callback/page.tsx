'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';

function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Signing you in...');
  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );

  useEffect(() => {
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/';

    let active = true;

    const exchange = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (session?.user) {
        router.replace(next);
        router.refresh();
        return;
      }

      if (!code) {
        setMessage('Missing authorisation code.');
        return;
      }

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (error) {
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (!active) return;
        if (retrySession?.user) {
          router.replace(next);
          router.refresh();
          return;
        }
        setMessage(`Sign-in failed: ${error.message}`);
        return;
      }

      router.replace(next);
      router.refresh();
    };

    exchange();

    return () => {
      active = false;
    };
  }, [router, searchParams, supabase]);

  return (
    <div className="min-h-screen flex items-center justify-center text-green-100">
      {message}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-green-100">Signing you in...</div>}>
      <AuthCallbackClient />
    </Suspense>
  );
}
