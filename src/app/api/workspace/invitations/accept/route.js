import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export async function POST() {
    try {
        const supabase = await createServerClient();

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user?.email) {
            return NextResponse.json(
                { error: "Your session has expired. Please sign in again." },
                { status: 401 }
            );
        }

        const organizationId = user.user_metadata?.invited_organization_id;

        if (!organizationId) {
            return NextResponse.json(
                { error: "Invitation workspace could not be identified." },
                { status: 400 }
            );
        }

        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!serviceRoleKey) {
            console.error("SUPABASE_SERVICE_ROLE_KEY is not configured.");

            return NextResponse.json(
                { error: "Invitation service is not configured." },
                { status: 500 }
            );
        }

        const admin = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        const { data: invitation, error: invitationError } = await admin
            .from("workspace_invitations")
            .select("id, organization_id, role, status")
            .eq("organization_id", organizationId)
            .ilike("email", user.email)
            .eq("status", "pending")
            .maybeSingle();

        if (invitationError) {
            console.error("Invitation lookup failed:", invitationError.message);

            return NextResponse.json(
                { error: "Could not verify your invitation." },
                { status: 500 }
            );
        }

        if (!invitation) {
            return NextResponse.json(
                { error: "No pending invitation was found for your account." },
                { status: 404 }
            );
        }

        const { error: membershipError } = await admin
            .from("organization_members")
            .upsert(
                {
                    organization_id: invitation.organization_id,
                    user_id: user.id,
                    role: invitation.role,
                },
                { onConflict: "organization_id,user_id" }
            );

        if (membershipError) {
            console.error("Workspace membership failed:", membershipError.message);

            return NextResponse.json(
                { error: "Could not add you to the workspace." },
                { status: 500 }
            );
        }

        const { error: updateError } = await admin
            .from("workspace_invitations")
            .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
            })
            .eq("id", invitation.id)
            .eq("status", "pending");

        if (updateError) {
            console.error("Invitation status update failed:", updateError.message);

            return NextResponse.json(
                { error: "You were added, but the invitation status could not be updated. Please retry." },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Invitation accepted successfully.",
        });
    } catch (error) {
        console.error("Accept invitation failed:", error);

        return NextResponse.json(
            { error: "Something went wrong while accepting the invitation." },
            { status: 500 }
        );
    }
}