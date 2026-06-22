import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

const locales = ["en", "vi"];
const defaultLocale = "en";

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // /en/... is the default, /vi/... for Vietnamese
});

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Check if it's a protected route
  const isPortalRoute = /^\/(en\/|vi\/)?portal/.test(pathname);
  const isAdminRoute  = /^\/(en\/|vi\/)?admin/.test(pathname);

  if (isPortalRoute || isAdminRoute) {
    const response = NextResponse.next();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll(); },
          setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    const locale = pathname.startsWith("/vi") ? "vi" : "en";

    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/auth/login?redirect=${pathname}`, request.url));
    }

    if (isAdminRoute) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", session.user.id)
        .single();

      if (profile?.role !== "admin") {
        return NextResponse.redirect(new URL(`/${locale}/portal`, request.url));
      }
    }

    return response;
  }

  return intlMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
