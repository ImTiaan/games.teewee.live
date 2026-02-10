import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  console.log('[AuthCallback] Route hit');
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';
  
  console.log('[AuthCallback] Code present:', !!code);
  console.log('[AuthCallback] Next path:', next);

  if (code) {
    // Prepare the redirect URL with debug params
    const forwardedHost = request.headers.get('x-forwarded-host');
    const isLocalEnv = process.env.NODE_ENV === 'development';
    
    let redirectUrl = `${origin}${next}`;
    if (isLocalEnv) {
      redirectUrl = `${origin}${next}`;
    } else if (forwardedHost) {
      redirectUrl = `https://${forwardedHost}${next}`;
    }

    const redirectUrlObj = new URL(redirectUrl);
    redirectUrlObj.searchParams.set('auth_status', 'success');
    
    // Create the response object specifically to hold cookies
    const response = NextResponse.redirect(redirectUrlObj.toString());

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            try {
              console.log('[AuthCallback] Setting cookies on response:', cookiesToSet.map(c => c.name));
              cookiesToSet.forEach(({ name, value, options }) =>
                response.cookies.set(name, value, options)
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
      // Update the UID param now that we have it
      const finalUrl = new URL(response.headers.get('Location')!);
      finalUrl.searchParams.set('auth_uid', session?.user?.id ?? 'unknown');
      response.headers.set('Location', finalUrl.toString());

      console.log('[AuthCallback] Redirecting to:', finalUrl.toString());
      return response;
    } else {
        console.error('[AuthCallback] Exchange Code Error:', error);
        return NextResponse.redirect(`${origin}/auth/auth-code-error?error=${encodeURIComponent(error.message)}`);
    }
  } else {
      console.error('[AuthCallback] No code provided in URL');
  }

  // return the user to an error page with instructions
  console.log('[AuthCallback] Redirecting to error page');
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
