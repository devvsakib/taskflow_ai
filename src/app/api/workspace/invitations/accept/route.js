
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
                { error: "Invitation workspace could not be identified. Please open your invitation email again." },
                { status: 400 }
            );
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !serviceRoleKey) {
            console.error("Invitation service configuration is missing.");

            return NextResponse.json(
                { error: "Invitation service is not configured." },
                { status: 500 }
            );
        }

        const admin = createSupabaseClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // Verify the workspace ID against an actual pending invitation
        // for the authenticated user's email.
        const { data: invitation, error: invitationError } = await admin
            .from("workspace_invitations")
            .select("id, organization_id, role")
            .eq("organization_id", organizationId)
            .ilike("email", user.email.trim())
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
                { error: "No pending invitation was found for your account and workspace." },
                { status: 404 }
            );
        }

        // Check existing membership so accepting an invitation never
        // overwrites an existing member's role.
        const { data: existingMembership, error: membershipLookupError } =
            await admin
                .from("organization_members")
                .select("user_id")
                .eq("organization_id", invitation.organization_id)
                .eq("user_id", user.id)
                .maybeSingle();

        if (membershipLookupError) {
            console.error(
                "Membership lookup failed:",
                membershipLookupError.message
            );

            return NextResponse.json(
                { error: "Could not verify workspace membership." },
                { status: 500 }
            );
        }

        if (!existingMembership) {
            const { error: insertError } = await admin
                .from("organization_members")
                .insert({
                    organization_id: invitation.organization_id,
                    user_id: user.id,
                    role: invitation.role,
                });

            if (insertError) {
                console.error(
                    "Workspace membership creation failed:",
                    insertError.message
                );

                return NextResponse.json(
                    { error: "Could not add you to the workspace. Please retry." },
                    { status: 500 }
                );
            }
        }

        // Mark the invitation accepted only after membership is confirmed.
        const { data: updatedInvitations, error: updateError } = await admin
            .from("workspace_invitations")
            .update({
                status: "accepted",
                accepted_at: new Date().toISOString(),
            })
            .eq("id", invitation.id)
            .eq("status", "pending")
            .select("id");

        if (updateError) {
            console.error(
                "Invitation status update failed:",
                updateError.message
            );

            return NextResponse.json(
                {
                    error: "Your membership is in place, but the invitation status could not be updated. Please contact the workspace owner.",
                },
                { status: 500 }
            );
        }

        if (!updatedInvitations?.length) {
            return NextResponse.json(
                {
                    error: "The invitation was already processed. Please refresh and check your workspace.",
                },
                { status: 409 }
            );
        }

        return NextResponse.json({
            success: true,
            message: existingMembership
                ? "You are already a member of this workspace."
                : "Invitation accepted successfully.",
        });
    } catch (error) {
        console.error("Accept invitation failed:", error);

        return NextResponse.json(
            { error: "Something went wrong while accepting the invitation." },
            { status: 500 }
        );
    }
}
