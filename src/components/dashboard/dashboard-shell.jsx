
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

export default function DashboardShell({
    workspace,
    projects,
    children,
}) {
    const [search, setSearch] = useState("");

    useEffect(() => {
        function handleOpenSearch() {
            document.getElementById("taskflow-search")?.focus();
        }

        window.addEventListener("taskflow:open-search", handleOpenSearch);

        return () =>
            window.removeEventListener("taskflow:open-search", handleOpenSearch);
    }, []);

    return (
        <div className="flex h-svh overflow-hidden bg-background">
            <div className="hidden md:block">
                <DashboardSidebar workspace={workspace} projects={projects} />
            </div>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                id="taskflow-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search projects and issues..."
                                className="h-9 border-transparent bg-muted/60 pl-9 shadow-none focus-visible:border-ring"
                            />
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <span className="hidden text-xs text-muted-foreground lg:block">
                            Your workspace
                        </span>
                        <Separator orientation="vertical" className="mx-1 h-5" />
                        <ThemeToggle />
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
