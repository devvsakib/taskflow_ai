"use client";

import Link from "next/link";
import {
    ArrowRight,
    CheckCircle2,
    CircleDashed,
    Clock3,
    FolderKanban,
    Plus,
    Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

function MetricCard({ title, value, description, icon: Icon }) {
    return (
        <Card className="border-border/70 shadow-none">
            <CardContent className="p-5">
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{title}</p>
                    <Icon className="size-4 text-muted-foreground" />
                </div>
                <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

export default function DashboardOverview({
    workspace,
    projects = [],
    issues = [],
}) {
    const inProgress = issues.filter(
        (issue) => issue.status === "in_progress"
    ).length;

    const completed = issues.filter(
        (issue) => issue.status === "done"
    ).length;

    const activeProjects = projects.filter(
        (project) => project.status === "active"
    ).length;

    return (
        <div className="mx-auto w-full max-w-7xl space-y-8 p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{workspace?.name || "Workspace"}</span>
                        <span>/</span>
                        <span>Overview</span>
                    </div>
                    <h1 className="text-3xl font-semibold tracking-tight">
                        Good to see you again.
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Here's what's happening across your workspace.
                    </p>
                </div>

                <Button
                    onClick={() =>
                        window.dispatchEvent(new Event("taskflow:new-project"))
                    }
                >
                    <Plus className="size-4" />
                    New project
                </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Active projects"
                    value={activeProjects}
                    description="Projects currently in progress"
                    icon={FolderKanban}
                />
                <MetricCard
                    title="Total issues"
                    value={issues.length}
                    description="Across your workspace"
                    icon={CircleDashed}
                />
                <MetricCard
                    title="In progress"
                    value={inProgress}
                    description="Issues being worked on"
                    icon={Clock3}
                />
                <MetricCard
                    title="Completed"
                    value={completed}
                    description="Issues marked as done"
                    icon={CheckCircle2}
                />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
                <Card className="border-border/70 shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0">
                        <div>
                            <CardTitle className="text-base">Your projects</CardTitle>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Keep track of your team's work.
                            </p>
                        </div>
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/dashboard/projects">
                                View all <ArrowRight className="ml-1 size-4" />
                            </Link>
                        </Button>
                    </CardHeader>

                    <CardContent>
                        {projects.length ? (
                            <div className="divide-y">
                                {projects.slice(0, 5).map((project) => (
                                    <Link
                                        key={project.id}
                                        href={`/dashboard/projects/${project.id}`}
                                        className="flex items-center gap-3 rounded-lg py-4 transition-colors hover:bg-muted/50"
                                    >
                                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary">
                                            {project.key?.slice(0, 2) || "PR"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {project.name}
                                            </p>
                                            <p className="mt-1 truncate text-xs text-muted-foreground">
                                                {project.key}
                                                {project.description
                                                    ? ` · ${project.description}`
                                                    : ""}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                project.status === "active" ? "secondary" : "outline"
                                            }
                                        >
                                            {project.status}
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed px-5 py-12 text-center">
                                <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                                    <FolderKanban className="size-6" />
                                </div>
                                <h3 className="font-medium">Start with your first project</h3>
                                <p className="mt-2 max-w-xs text-sm leading-6 text-muted-foreground">
                                    Organize your work into projects and track every issue in one place.
                                </p>
                                <Button
                                    className="mt-5"
                                    onClick={() =>
                                        window.dispatchEvent(new Event("taskflow:new-project"))
                                    }
                                >
                                    <Plus className="size-4" />
                                    Create a project
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-border/70 shadow-none">
                    <CardHeader>
                        <CardTitle className="text-base">Quick start</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Set up your workspace for success.
                        </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="rounded-xl border p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <Sparkles className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Create a project</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Give your next initiative a home.
                                    </p>
                                </div>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 w-full"
                                onClick={() =>
                                    window.dispatchEvent(new Event("taskflow:new-project"))
                                }
                            >
                                Get started <ArrowRight className="size-4" />
                            </Button>
                        </div>

                        <div className="rounded-xl border p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                                    <CheckCircle2 className="size-4" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Track your issues</p>
                                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                                        Break work into manageable tasks.
                                    </p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-muted-foreground">
                                {issues.length} {issues.length === 1 ? "issue" : "issues"} in your workspace
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
