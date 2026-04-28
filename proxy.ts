import createIntlMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from './lib/i18n/routing';

const handleI18n = createIntlMiddleware(routing);

const PROTECTED = ['/dashboard', '/onboarding', '/outreach'];
const AUTH_ONLY = ['/auth/login', '/auth/signup'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const pathWithoutLocale = pathname.replace(/^\/(en|es)/, '') || '/';

  const isProtected = PROTECTED.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  );
  const isAuthOnly = AUTH_ONLY.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + '/')
  );

  if (!isProtected && !isAuthOnly) {
    return handleI18n(request);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const locale = pathname.match(/^\/(en|es)/)?.[1] ?? 'en';

  if (isProtected && !user) {
    const loginUrl = new URL(`/${locale}/auth/login`, request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthOnly && user) {
    return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
  }

  const i18nResponse = handleI18n(request);
  response.cookies.getAll().forEach(({ name, value }) => {
    i18nResponse.cookies.set(name, value);
  });
  return i18nResponse;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
