'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AuthCallbackPage() {
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

    if (!code) {
      setMessage('Missing authorisation code.');
      return;
    }

    let active = true;

    const exchange = async () => {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!active) return;

      if (error) {
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
