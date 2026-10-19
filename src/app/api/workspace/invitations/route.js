import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request) {
    try {
        // 1. Verify the currently signed-in user.
        const supabase = await createClient();

        const {
            data: { claims },
            error: claimsError,
        } = await supabase.auth.getClaims();

        if (claimsError || !claims?.sub) {
            return NextResponse.json(
                { error: "Please sign in to invite members." },
                { status: 401 }
            );
        }

        // 2. Validate the request.
        const body = await request.json();

        const organizationId = body.organizationId;
        const email = String(body.email || "").trim().toLowerCase();
        const role = body.role || "member";

        if (!organizationId || !email) {
            return NextResponse.json(
                { error: "Workspace and email are required." },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address." },
                { status: 400 }
            );
        }

        if (!["member", "admin"].includes(role)) {
            return NextResponse.json(
                { error: "Invalid invitation role." },
                { status: 400 }
            );
        }

        // 3. Verify the inviter's workspace role.
        const { data: membership, error: membershipError } = await supabase
            .from("organization_members")
            .select("role")
            .eq("organization_id", organizationId)
            .eq("user_id", claims.sub)
            .maybeSingle();

        if (membershipError || !membership) {
            return NextResponse.json(
                { error: "You do not have access to this workspace." },
                { status: 403 }
            );
        }

        if (!["owner", "admin"].includes(membership.role)) {
            return NextResponse.json(
                { error: "Only workspace owners and admins can invite members." },
                { status: 403 }
            );
        }

        if (role === "admin" && membership.role !== "owner") {
            return NextResponse.json(
                { error: "Only workspace owners can invite administrators." },
                { status: 403 }
            );
        }

        // 4. Check required server-side configuration.
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

        if (!supabaseUrl || !serviceRoleKey || !siteUrl) {
            console.error("Invitation configuration missing:", {
                hasSupabaseUrl: Boolean(supabaseUrl),
                hasServiceRoleKey: Boolean(serviceRoleKey),
                hasSiteUrl: Boolean(siteUrl),
            });

            return NextResponse.json(
                { error: "Invitation service is not configured." },
                { status: 500 }
            );
        }

        const admin = createAdminClient(
            supabaseUrl,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            }
        );

        // 5. Check the workspace.
        const { data: organization, error: organizationError } =
            await supabase
                .from("organizations")
                .select("id, name")
                .eq("id", organizationId)
                .maybeSingle();

        if (organizationError || !organization) {
            return NextResponse.json(
                { error: "Workspace not found." },
                { status: 404 }
            );
        }

        // 6. Check whether the email already belongs to a workspace member.
        const { data: authUsers, error: authUsersError } =
            await admin.auth.admin.listUsers({
                page: 1,
                perPage: 1000,
            });

        if (authUsersError) {
            console.error("Could not check existing users:", authUsersError.message);

            return NextResponse.json(
                { error: "Could not validate the invited user." },
                { status: 500 }
            );
        }

        const existingUser = authUsers.users.find(
            (user) => user.email?.toLowerCase() === email
        );

        if (existingUser) {
            const { data: existingMembership, error: existingMembershipError } =
                await admin
                    .from("organization_members")
                    .select("user_id")
                    .eq("organization_id", organizationId)
                    .eq("user_id", existingUser.id)
                    .maybeSingle();

            if (existingMembershipError) {
                return NextResponse.json(
                    { error: "Could not check workspace membership." },
                    { status: 500 }
                );
            }

            if (existingMembership) {
                return NextResponse.json(
                    { error: "This user is already a workspace member." },
                    { status: 409 }
                );
            }
        }

        // 7. Prevent duplicate pending invitations.
        const { data: existingInvitation, error: lookupError } = await admin
            .from("workspace_invitations")
            .select("id")
            .eq("organization_id", organizationId)
            .eq("email", email)
            .eq("status", "pending")
            .maybeSingle();

        if (lookupError) {
            console.error("Invitation lookup failed:", lookupError.message);

            return NextResponse.json(
                { error: "Could not check existing invitations." },
                { status: 500 }
            );
        }

        if (existingInvitation) {
            return NextResponse.json(
                { error: "An invitation for this email is already pending." },
                { status: 409 }
            );
        }

        // 8. Create a pending invitation.
        // IMPORTANT: Do not insert into organization_members here.
        const { data: invitation, error: invitationError } = await admin
            .from("workspace_invitations")
            .insert({
                organization_id: organizationId,
                email,
                role,
                invited_by: claims.sub,
                status: "pending",
            })
            .select("id")
            .single();

        if (invitationError || !invitation) {
            console.error(
                "Invitation creation failed:",
                invitationError?.message
            );

            return NextResponse.json(
                { error: "Could not create the invitation." },
                { status: 500 }
            );
        }

        // 9. Send the Supabase invitation email.
        const { error: emailError } = await admin.auth.admin.inviteUserByEmail(
            email,
            {
                redirectTo: `${siteUrl}/auth/confirm`,
                data: {
                    invited_organization_id: organizationId,
                    invited_organization_name: organization.name,
                    full_name: email.split("@")[0],
                },
            }
        );

        if (emailError) {
            console.error("Invitation email failed:", {
                message: emailError.message,
                status: emailError.status,
                code: emailError.code,
                name: emailError.name,
            });

            const { error: cleanupError } = await admin
                .from("workspace_invitations")
                .delete()
                .eq("id", invitation.id);

            if (cleanupError) {
                console.error("Invitation cleanup failed:", cleanupError.message);
            }

            return NextResponse.json(
                {
                    error: emailError.message || "Failed to send invitation email.",
                    code: emailError.code || null,
                },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Invitation sent successfully.",
        });
    } catch (error) {
        console.error("Invitation API failed:", error);

        return NextResponse.json(
            { error: "An unexpected error occurred while sending the invitation." },
            { status: 500 }
        );
    }
}