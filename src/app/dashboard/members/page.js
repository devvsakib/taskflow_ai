
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MembersPage } from "@/components/members/members-page";

export default async function WorkspaceMembersPage() {
    const supabase = await createClient();

    const { data: claimsData, error: claimsError } =
        await supabase.auth.getClaims();

    const userId = claimsData?.claims?.sub;

    if (claimsError || !userId) {
        redirect("/login");
    }

    const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membership) {
        redirect("/onboarding");
    }

    const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("id, name, slug")
        .eq("id", membership.organization_id)
        .maybeSingle();

    if (organizationError || !organization) {
        redirect("/onboarding");
    }

    const { data: organizationMembers, error: membersError } =
        await supabase
            .from("organization_members")
            .select("user_id, role, joined_at")
            .eq("organization_id", membership.organization_id)
            .order("joined_at", { ascending: true });

    if (membersError) {
        return (
            <div className="p-6">
                <h1 className="text-lg font-semibold">Unable to load members</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    Please refresh the page and try again.
                </p>
            </div>
        );
    }

    const memberIds = (organizationMembers || []).map(
        (member) => member.user_id
    );

    let profiles = [];

    if (memberIds.length > 0) {
        const { data, error } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, email")
            .in("id", memberIds);

        if (error) {
            return (
                <div className="p-6">
                    <h1 className="text-lg font-semibold">
                        Unable to load member profiles
                    </h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Please refresh the page and try again.
                    </p>
                </div>
            );
        }

        profiles = data || [];
    }

    const members = (organizationMembers || []).map((member) => {
        const profile = profiles.find(
            (item) => item.id === member.user_id
        );

        return {
            id: member.user_id,
            role: member.role,
            joinedAt: member.joined_at,
            fullName: profile?.full_name || "Workspace member",
            email: profile?.email || "",
            avatarUrl: profile?.avatar_url || null,
        };
    });

    return (
        <MembersPage
            organization={organization}
            members={members}
            currentUserId={userId}
            currentUserRole={membership.role}
        />
    );
}
