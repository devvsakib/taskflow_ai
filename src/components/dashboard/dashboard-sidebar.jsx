
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Activity,
    ChevronDown,
    CircleHelp,
    Command,
    FolderKanban,
    Inbox,
    LayoutDashboard,
    Plus,
    Settings2,
    Users,
    Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

const mainNavigation = [
    { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { label: "My issues", href: "/dashboard/my-issues", icon: Inbox },
    { label: "Activity", href: "/dashboard/activity", icon: Activity },
];

export default function DashboardSidebar({ workspace, projects = [] }) {
    const pathname = usePathname();

    function isActive(href) {
        return href === "/dashboard"
            ? pathname === href
            : pathname === href || pathname.startsWith(`${href}/`);
    }

    return (
        <aside className="flex h-full w-[250px] shrink-0 flex-col border-r bg-sidebar text-sidebar-foreground">
            <div className="p-4">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="h-auto w-full justify-between px-2 py-2 hover:bg-sidebar-accent"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
                                    <Zap className="size-5" />
                                </span>
                                <span className="min-w-0 text-left">
                                    <span className="block truncate text-sm font-semibold">
                                        {workspace?.name || "TaskFlow"}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Workspace
                                    </span>
                                </span>
                            </div>
                            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem disabled>
                            <FolderKanban className="mr-2 size-4" />
                            {workspace?.name || "My workspace"}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/onboarding">
                                <Plus className="mr-2 size-4" />
                                Create workspace
                            </Link>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="px-3 pb-3">
                <Button
                    variant="outline"
                    className="h-9 w-full justify-start gap-2 bg-background/60 font-normal text-muted-foreground"
                    onClick={() =>
                        window.dispatchEvent(new Event("taskflow:open-search"))
                    }
                >
                    <Command className="size-4" />
                    <span className="flex-1 text-left">Search anything...</span>
                    <kbd className="rounded border px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
                </Button>
            </div>

            <Separator />

            <div className="flex-1 space-y-6 overflow-y-auto p-3">
                <section>
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Workspace
                    </p>
                    <nav className="space-y-1">
                        {mainNavigation.map(({ label, href, icon: Icon }) => (
                            <Button
                                key={href}
                                asChild
                                variant="ghost"
                                className={`h-9 w-full justify-start gap-3 px-2.5 font-normal ${isActive(href)
                                        ? "bg-primary/10 font-medium text-primary hover:bg-primary/15 hover:text-primary"
                                        : "text-muted-foreground"
                                    }`}
                            >
                                <Link href={href}>
                                    <Icon className="size-[17px]" />
                                    {label}
                                    {label === "My issues" && (
                                        <Badge variant="secondary" className="ml-auto text-[10px]">
                                            0
                                        </Badge>
                                    )}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </section>

                <section>
                    <div className="mb-2 flex items-center justify-between px-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Projects
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground"
                            onClick={() => window.dispatchEvent(new Event("taskflow:new-project"))}
                            aria-label="Create project"
                        >
                            <Plus className="size-4" />
                        </Button>
                    </div>

                    <nav className="space-y-1">
                        {projects.map((project) => (
                            <Button
                                key={project.id}
                                asChild
                                variant="ghost"
                                className="h-9 w-full justify-start gap-2.5 px-2.5 font-normal text-muted-foreground"
                            >
                                <Link href={`/dashboard/projects/${project.id}`}>
                                    <span className="flex size-5 items-center justify-center rounded-md border text-[10px] font-semibold">
                                        {project.key?.slice(0, 2) || "PR"}
                                    </span>
                                    <span className="truncate">{project.name}</span>
                                </Link>
                            </Button>
                        ))}

                        {!projects.length && (
                            <p className="px-2 py-2 text-xs leading-5 text-muted-foreground">
                                Your projects will appear here.
                            </p>
                        )}
                    </nav>
                </section>

                <section>
                    <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Manage
                    </p>
                    <Button
                        asChild
                        variant="ghost"
                        className="h-9 w-full justify-start gap-3 px-2.5 font-normal text-muted-foreground"
                    >
                        <Link href="/dashboard/settings">
                            <Settings2 className="size-[17px]" />
                            Settings
                        </Link>
                    </Button>
                    <Button
                        asChild
                        variant="ghost"
                        className="h-9 w-full justify-start gap-3 px-2.5 font-normal text-muted-foreground"
                    >
                        <Link href="/dashboard/members">
                            <Users className="size-[17px]" />
                            Members
                        </Link>
                    </Button>
                </section>
            </div>

            <div className="border-t p-3">
                <Button
                    variant="ghost"
                    className="mb-2 h-9 w-full justify-start gap-3 px-2.5 font-normal text-muted-foreground"
                    onClick={() => window.dispatchEvent(new Event("taskflow:help"))}
                >
                    <CircleHelp className="size-[17px]" />
                    Help & support
                </Button>

                <Separator className="mb-3" />

                <div className="flex items-center gap-3 px-2 py-1">
                    <Avatar className="size-8">
                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                            TF
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">Your account</p>
                        <p className="truncate text-xs text-muted-foreground">
                            TaskFlow member
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
