import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/dashboard/dashboard-shell";
import DashboardOverview from "@/components/dashboard/dashboard-overview";


export default async function DashboardPage() {
    const supabase = await createClient();

    const {
        data: { claims },
        error,
    } = await supabase.auth.getClaims();


    if (error || !claims?.sub) {
        redirect("/login");
    }

    const email =
        typeof claims.email === "string" ? claims.email : "your account";

    const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", claims.sub)
        .limit(1);

    if (membershipError) {
        throw new Error("Unable to load your workspace memberships.");
    }

    if (!memberships?.length) {
        redirect("/onboarding");
    }

    const organizationId = memberships[0].organization_id;

    const [
        { data: workspace, error: workspaceError },
        { data: projects, error: projectsError },
        { data: issues, error: issuesError },
    ] = await Promise.all([
        supabase
            .from("organizations")
            .select("id, name, slug")
            .eq("id", organizationId)
            .single(),

        supabase
            .from("projects")
            .select("id, name, key, description, status")
            .eq("organization_id", organizationId)
            .order("created_at", { ascending: false }),

        supabase
            .from("issues")
            .select("id, status")
            .eq("organization_id", organizationId),
    ]);

    if (workspaceError || projectsError || issuesError) {
        throw new Error("Unable to load your workspace dashboard.");
    }

    return (
        <DashboardShell workspace={workspace} projects={projects || []}>
            <DashboardOverview
                workspace={workspace}
                projects={projects || []}
                issues={issues || []}
            />
        </DashboardShell>
    );
}