import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, FolderKanban, Plus } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ProjectIssueActions } from "@/components/issues/project-issue-actions";
import { IssueDetailsDialog } from "@/components/issues/issue-details-dialog";
import { toast } from "sonner";
import { ProjectIssuesTable } from "@/components/issues/project-issues-table";
import { ProjectSettingsDialog } from "@/components/projects/project-settings-dialog";

export default async function ProjectDetailsPage({ params }) {
    const { projectId } = await params;
    const supabase = await createClient();

    // Verify authentication.
    const {
        data: { claims },
        error: authError,
    } = await supabase.auth.getClaims();

    if (authError || !claims?.sub) {
        redirect("/login");
    }

    // Find the user's workspace membership.
    const { data: membership, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id, role")
        .eq("user_id", claims.sub)
        .limit(1)
        .maybeSingle();

    if (membershipError || !membership) {
        redirect("/onboarding");
    }

    // Fetch the project within the user's workspace.
    const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("id, organization_id, name, key, description, status, created_at")
        .eq("id", projectId)
        .eq("organization_id", membership.organization_id)
        .maybeSingle();

    if (projectError) {
        toast.error("Unable to load this project.");
    }

    if (!project) {
        notFound();
    }

    // Fetch issues belonging to this project.
    const { data: issues, error: issuesError } = await supabase
        .from("issues")
        .select(
            "id, issue_number, title, description, status, priority, assignee_id,created_at, due_date"
        )
        .eq("organization_id", membership.organization_id)
        .eq("project_id", project.id)
        .order("created_at", { ascending: false });

    if (issuesError) {
        toast.error("Unable to load project issues.");
    }

    const { data: organizationMembers, error: membersError } = await supabase
        .from("organization_members")
        .select("user_id, role")
        .eq("organization_id", membership.organization_id);

    if (membersError) {
        toast.error("Unable to load workspace members.");
    }

    const memberIds = (organizationMembers || []).map(
        (member) => member.user_id
    );

    let profiles = [];

    if (memberIds.length > 0) {
        const { data, error: profilesError } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url")
            .in("id", memberIds);

        if (profilesError) {
            toast.error("Unable to load member profiles.");
        }

        profiles = data || [];
    }

    const members = (organizationMembers || []).map((member) => {
        const profile = profiles.find((item) => item.id === member.user_id);

        return {
            id: member.user_id,
            role: member.role,
            full_name: profile?.full_name || "Workspace member",
            avatar_url: profile?.avatar_url || null,
        };
    });

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
                {/* Back navigation */}
                <Button variant="ghost" asChild className="-ml-3">
                    <Link href="/dashboard">
                        <ArrowLeft className="mr-2 size-4" />
                        Back to dashboard
                    </Link>
                </Button>

                {/* Project heading */}
                <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <FolderKanban className="size-6" />
                        </div>

                        <div className="min-w-0 space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                                    {project.name}
                                </h1>

                                <Badge variant="secondary">{project.key}</Badge>
                            </div>

                            <p className="text-sm text-muted-foreground">
                                {project.description || "No project description yet."}
                            </p>
                        </div>
                    </div>

                    <div>
                        <ProjectSettingsDialog
                            project={project}
                            role={membership.role}
                        />
                        <ProjectIssueActions
                            projectId={project.id}
                            organizationId={membership.organization_id}
                            members={members}
                        />
                    </div>
                </div>

                {/* Project overview */}
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Total issues
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">{issues.length}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                In progress
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">
                                {issues.filter((issue) => issue.status === "in_progress").length}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">
                                Completed
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-3xl font-semibold">
                                {issues.filter((issue) => issue.status === "done").length}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Issues table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Issues</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Track work and monitor progress for this project.
                        </p>
                    </CardHeader>

                    <CardContent>
                        {issues.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
                                    <FolderKanban className="size-6 text-muted-foreground" />
                                </div>

                                <h2 className="font-medium">No issues yet</h2>

                                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                    Issues will appear here when you start adding work to this
                                    project.
                                </p>
                            </div>
                        ) : (
                            <ProjectIssuesTable
                                issues={issues || []}
                                projectId={project.id}
                                organizationId={membership.organization_id}
                                projectKey={project.key}
                                members={members}
                            />
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}