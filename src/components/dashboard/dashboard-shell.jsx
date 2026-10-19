
"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import DashboardSidebar from "@/components/dashboard/dashboard-sidebar";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";


export default function DashboardShell({
    workspace,
    projects,
    children,
}) {
    const [search, setSearch] = useState("");
    const router = useRouter();
    const supabase = createClient();

    const [user, setUser] = useState(null);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        async function loadUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);
        }

        loadUser();
    }, []);

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                toast.error(error.message || "Unable to log out.");
                setIsLoggingOut(false);
                return;
            }

            router.replace("/login");
            router.refresh();
        } catch {
            toast.error("Something went wrong while logging out.");
            setIsLoggingOut(false);
        }
    };

    const displayName =
        user?.user_metadata?.full_name ||
        user?.email?.split("@")[0] ||
        "Account";

    const initials = displayName
        .split(/\s+/)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

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
                        <ThemeToggle />

                        <Separator orientation="vertical" className="mx-1 h-5" />

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-9 rounded-full"
                                    aria-label="Open account menu"
                                >
                                    <Avatar className="size-8">
                                        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end" className="w-60">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col gap-1">
                                        <span className="truncate text-sm font-medium">
                                            {displayName}
                                        </span>
                                        <span className="truncate text-xs text-muted-foreground">
                                            {user?.email}
                                        </span>
                                    </div>
                                </DropdownMenuLabel>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="cursor-pointer text-destructive focus:text-destructive"
                                >
                                    <LogOut className="mr-2 size-4" />
                                    {isLoggingOut ? "Logging out..." : "Log out"}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            </div>
        </div>
    );
}
