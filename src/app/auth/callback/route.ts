import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.log('[AuthCallback] Route hit');
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  
  console.log('[AuthCallback] Code present:', !!code);
  console.log('[AuthCallback] Next path:', next);

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              console.log('[AuthCallback] Setting cookies:', cookiesToSet.map(c => c.name));
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch (error) {
              console.error('[AuthCallback] Error setting cookies:', error);
            }
          },
        },
      }
    );
    
    console.log('[AuthCallback] Exchanging code for session...');
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      console.log('[AuthCallback] Session exchange successful. User:', session?.user?.id);
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      let redirectUrl = `${origin}${next}`;
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`;
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`;
      }
      
      console.log('[AuthCallback] Redirecting to:', redirectUrl);
      return NextResponse.redirect(redirectUrl);
    } else {
        console.error('[AuthCallback] Exchange Code Error:', error);
    }
  } else {
      console.error('[AuthCallback] No code provided in URL');
  }

  // return the user to an error page with instructions
  console.log('[AuthCallback] Redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
