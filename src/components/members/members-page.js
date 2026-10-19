
"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { Search, Users, ShieldCheck, UserRound } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { LayoutDashboard, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const roleConfig = {
    owner: {
        label: "Owner",
        variant: "default",
    },
    admin: {
        label: "Admin",
        variant: "secondary",
    },
    member: {
        label: "Member",
        variant: "outline",
    },
};

export function MembersPage({
    organization,
    members = [],
    currentUserId,
    currentUserRole,
}) {
    const [search, setSearch] = useState("");
    const [inviteOpen, setInviteOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState("member");
    const [isInviting, setIsInviting] = useState(false);

    const canInvite = ["owner", "admin"].includes(currentUserRole);

    const filteredMembers = useMemo(() => {
        const query = search.trim().toLowerCase();

        if (!query) return members;

        return members.filter(
            (member) =>
                member.fullName.toLowerCase().includes(query) ||
                (member.email || "").toLowerCase().includes(query)
        );
    }, [members, search]);

    const ownerCount = members.filter(
        (member) => member.role === "owner"
    ).length;

    const adminCount = members.filter(
        (member) => member.role === "admin"
    ).length;

    async function handleInvite() {
        const email = inviteEmail.trim().toLowerCase();

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            toast.error("Enter a valid email address.");
            return;
        }

        setIsInviting(true);

        try {
            const response = await fetch("/api/workspace/invitations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    organizationId: organization.id,
                    email,
                    role: inviteRole,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                toast.error(result.error || "Unable to invite this member.");
                return;
            }

            toast.success(`Invitation sent to ${email}.`);
            setInviteEmail("");
            setInviteRole("member");
            setInviteOpen(false);
        } catch {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsInviting(false);
        }
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="size-4" />
                        Workspace
                        <span>/</span>
                        Members
                    </div>

                    <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                        Members
                    </h1>

                    <p className="mt-1 text-sm text-muted-foreground">
                        Manage the people who have access to {organization.name}.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">
                            <LayoutDashboard className="mr-2 size-4" />
                            Back to Dashboard
                        </Link>
                    </Button>

                    {canInvite && (
                        <Button onClick={() => setInviteOpen(true)}>
                            <UserPlus className="mr-2 size-4" />
                            Invite members
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Total members
                            </p>
                            <p className="text-2xl font-semibold">{members.length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                            <ShieldCheck className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Owners</p>
                            <p className="text-2xl font-semibold">{ownerCount}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="flex items-center gap-4 p-5">
                        <div className="rounded-lg bg-primary/10 p-3 text-primary">
                            <UserRound className="size-5" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Admins</p>
                            <p className="text-2xl font-semibold">{adminCount}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="gap-0 py-0">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h2 className="font-medium">Workspace members</h2>
                        <p className="text-sm text-muted-foreground">
                            People who currently have access to this workspace.
                        </p>
                    </div>

                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Search members..."
                            className="pl-9"
                        />
                    </div>
                </div>

                <Separator />

                {filteredMembers.length === 0 ? (
                    <div className="px-6 py-12 text-center">
                        <Users className="mx-auto size-8 text-muted-foreground" />
                        <p className="mt-3 font-medium">
                            {search ? "No matching members" : "No members found"}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {search
                                ? "Try searching with a different name."
                                : "Workspace members will appear here."}
                        </p>
                    </div>
                ) : (
                    <div className="divide-y">
                        {filteredMembers.map((member) => {
                            const role =
                                roleConfig[member.role] || roleConfig.member;

                            const initials = member.fullName
                                .split(" ")
                                .filter(Boolean)
                                .slice(0, 2)
                                .map((part) => part[0])
                                .join("")
                                .toUpperCase();

                            return (
                                <div
                                    key={member.id}
                                    className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <Avatar className="size-10">
                                            <AvatarImage
                                                src={member.avatarUrl || undefined}
                                                alt={member.fullName}
                                            />
                                            <AvatarFallback>{initials || "U"}</AvatarFallback>
                                        </Avatar>

                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {member.fullName}
                                                {member.id === currentUserId && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        You
                                                    </span>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                <Mail className="size-3" />
                                                <span className="truncate">
                                                    {member.email || "No email available"}
                                                </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                Joined{" "}
                                                {member.joinedAt
                                                    ? format(new Date(member.joinedAt), "MMM d, yyyy")
                                                    : "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 pl-[52px] sm:pl-0">
                                        <Badge variant={role.variant}>{role.label}</Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>

            <p className="text-xs text-muted-foreground">
                Your role: {roleConfig[currentUserRole]?.label || "Member"} ·{" "}
                {organization.slug}
            </p>
            <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Invite a workspace member</DialogTitle>
                        <DialogDescription>
                            Send an email invitation to join {organization.name}.
                        </DialogDescription>
                    </DialogHeader>

                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleInvite();
                        }}
                        className="space-y-4"
                    >
                        <div className="space-y-2">
                            <label htmlFor="invite-email" className="text-sm font-medium">
                                Email address
                            </label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(event) => setInviteEmail(event.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Workspace role</label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="member">Member</SelectItem>
                                    {currentUserRole === "owner" && (
                                        <SelectItem value="admin">Admin</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setInviteOpen(false)}
                                disabled={isInviting}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isInviting}>
                                {isInviting ? "Sending..." : "Send invitation"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
