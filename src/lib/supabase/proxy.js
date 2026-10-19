
import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function updateSession(request) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },

                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) => {
                        request.cookies.set(name, value);
                    });

                    supabaseResponse = NextResponse.next({
                        request,
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        supabaseResponse.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    // Refresh the session and verify the user's claims.
    const {
        data,
        error,
    } = await supabase.auth.getClaims();

    const { pathname, search } = request.nextUrl;
    const isDashboardRoute =
        pathname === "/dashboard" || pathname.startsWith("/dashboard/");

    if (isDashboardRoute && (error || !data?.claims)) {
        const redirectUrl = request.nextUrl.clone();

        redirectUrl.pathname = "/login";
        redirectUrl.search = "";
        redirectUrl.searchParams.set("next", `${pathname}${search}`);

        const redirectResponse = NextResponse.redirect(redirectUrl);

        // Preserve refreshed/cleared authentication cookies.
        supabaseResponse.cookies.getAll().forEach((cookie) => {
            redirectResponse.cookies.set(cookie);
        });

        return redirectResponse;
    }

    return supabaseResponse;
}
