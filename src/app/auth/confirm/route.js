import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request) {
    const url = new URL(request.url);

    const tokenHash = url.searchParams.get("token_hash");
    const type = url.searchParams.get("type");
    const next = url.searchParams.get("next") || "/set-password";

    // Only allow invite confirmation through this route.
    if (!tokenHash || type !== "invite") {
        return NextResponse.redirect(
            new URL("/login?error=invalid_invitation", url.origin)
        );
    }

    const safeNext =
        next.startsWith("/") && !next.startsWith("//")
            ? next
            : "/set-password";

    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type: "invite",
    });

    if (error) {
        console.error("Invitation confirmation failed:", error.message);

        return NextResponse.redirect(
            new URL("/login?error=confirmation_failed", url.origin)
        );
    }

    return NextResponse.redirect(new URL(safeNext, url.origin));
}