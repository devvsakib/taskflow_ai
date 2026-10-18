
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Pencil,
    Trash2,
    CalendarDays,
    UserRound,
    Flag,
    CircleDot,
    LoaderCircle,
    X,
    Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const statuses = [
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "To do" },
    { value: "in_progress", label: "In progress" },
    { value: "in_review", label: "In review" },
    { value: "done", label: "Done" },
];

const priorities = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "No priority" },
];

function formatDate(value) {
    if (!value) return "No due date";

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function getStatusLabel(value) {
    return statuses.find((item) => item.value === value)?.label || value;
}

function getPriorityLabel(value) {
    return priorities.find((item) => item.value === value)?.label || value;
}

export function IssueDetailsDialog({
    issue,
    projectId,
    organizationId,
    projectKey,
    members = [],
    open,
    onOpenChange,
}) {
    const router = useRouter();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("todo");
    const [priority, setPriority] = useState("none");
    const [assigneeId, setAssigneeId] = useState("unassigned");

    useEffect(() => {
        if (!open || !issue) return;

        setTitle(issue.title || "");
        setDescription(issue.description || "");
        setStatus(issue.status || "todo");
        setPriority(issue.priority || "none");
        setAssigneeId(issue.assignee_id || "unassigned");
        setIsEditing(false);
        setDeleteDialogOpen(false);
    }, [issue?.id, open]);

    function cancelEditing() {
        if (!issue) return;

        setTitle(issue.title || "");
        setDescription(issue.description || "");
        setStatus(issue.status || "todo");
        setPriority(issue.priority || "none");
        setAssigneeId(issue.assignee_id || "unassigned");
        setIsEditing(false);
    }

    async function handleSave() {
        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            toast.error("Issue title is required.");
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("issues")
                .update({
                    title: trimmedTitle,
                    description: description.trim() || null,
                    status,
                    priority,
                    assignee_id:
                        assigneeId === "unassigned" ? null : assigneeId,
                })
                .eq("id", issue.id)
                .eq("project_id", projectId)
                .eq("organization_id", organizationId)
                .select("id")
                .maybeSingle();

            if (error) {
                toast.error(
                    error.code === "42501"
                        ? "You don't have permission to update this issue."
                        : "Couldn't update the issue. Please try again."
                );
                return;
            }

            if (!data) {
                toast.error("The issue wasn't updated. Check your permissions.");
                return;
            }

            toast.success("Issue updated successfully!");
            setIsEditing(false);
            onOpenChange(false);
            router.refresh();
        } catch {
            toast.error("Something went wrong while updating the issue.");
        } finally {
            setIsSaving(false);
        }
    }

    async function handleDelete() {
        if (!issue) return;

        setIsDeleting(true);

        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("issues")
                .delete()
                .eq("id", issue.id)
                .eq("project_id", projectId)
                .eq("organization_id", organizationId)
                .select("id")
                .maybeSingle();

            if (error) {
                toast.error(
                    error.code === "42501"
                        ? "You don't have permission to delete this issue."
                        : "Couldn't delete the issue. Please try again."
                );
                return;
            }

            if (!data) {
                toast.error("The issue wasn't deleted. Check your permissions.");
                return;
            }

            toast.success("Issue deleted successfully!");
            setDeleteDialogOpen(false);
            onOpenChange(false);
            router.refresh();
        } catch {
            toast.error("Something went wrong while deleting the issue.");
        } finally {
            setIsDeleting(false);
        }
    }

    if (!issue) return null;

    const assignee = members.find(
        (member) => member.id === issue.assignee_id
    );

    return (
        <>
            <Dialog
                open={open}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) {
                        setIsEditing(false);
                        setDeleteDialogOpen(false);
                    }

                    onOpenChange(nextOpen);
                }}
            >
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-[620px]">
                    <DialogHeader>
                        <div className="flex flex-wrap items-center gap-2 pr-8">
                            <Badge variant="outline" className="font-mono">
                                {projectKey}-{issue.issue_number}
                            </Badge>

                            <Badge variant="secondary">
                                {getStatusLabel(isEditing ? status : issue.status)}
                            </Badge>
                        </div>

                        <DialogTitle className="pt-2 text-xl">
                            {isEditing ? "Edit issue" : issue.title}
                        </DialogTitle>

                        <DialogDescription>
                            {isEditing
                                ? "Update the issue details below."
                                : "Issue details and current assignment."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5">
                        {isEditing ? (
                            <>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="issue-title"
                                        className="text-sm font-medium"
                                    >
                                        Title
                                    </label>

                                    <Input
                                        id="issue-title"
                                        value={title}
                                        onChange={(event) => setTitle(event.target.value)}
                                        maxLength={200}
                                        autoFocus
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label
                                        htmlFor="issue-description"
                                        className="text-sm font-medium"
                                    >
                                        Description
                                    </label>

                                    <Textarea
                                        id="issue-description"
                                        value={description}
                                        onChange={(event) =>
                                            setDescription(event.target.value)
                                        }
                                        placeholder="Describe this issue..."
                                        rows={5}
                                    />
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Status</label>

                                        <Select value={status} onValueChange={setStatus}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {statuses.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">
                                            Priority
                                        </label>

                                        <Select value={priority} onValueChange={setPriority}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select priority" />
                                            </SelectTrigger>

                                            <SelectContent>
                                                {priorities.map((item) => (
                                                    <SelectItem
                                                        key={item.value}
                                                        value={item.value}
                                                    >
                                                        {item.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Assignee</label>

                                    <Select
                                        value={assigneeId}
                                        onValueChange={setAssigneeId}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select assignee" />
                                        </SelectTrigger>

                                        <SelectContent>
                                            <SelectItem value="unassigned">
                                                Unassigned
                                            </SelectItem>

                                            {members.map((member) => (
                                                <SelectItem key={member.id} value={member.id}>
                                                    {member.full_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="whitespace-pre-wrap break-words text-sm leading-6 text-foreground">
                                    {issue.description || (
                                        <span className="italic text-muted-foreground">
                                            No description provided.
                                        </span>
                                    )}
                                </div>

                                <div className="grid gap-4 rounded-lg border p-4 sm:grid-cols-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CircleDot className="size-4" />
                                            Status
                                        </div>

                                        <p className="text-sm font-medium">
                                            {getStatusLabel(issue.status)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Flag className="size-4" />
                                            Priority
                                        </div>

                                        <p className="text-sm font-medium">
                                            {getPriorityLabel(issue.priority)}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <UserRound className="size-4" />
                                            Assignee
                                        </div>

                                        <p className="text-sm font-medium">
                                            {assignee?.full_name || "Unassigned"}
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <CalendarDays className="size-4" />
                                            Due date
                                        </div>

                                        <p className="text-sm font-medium">
                                            {formatDate(issue.due_date)}
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
                        {isEditing ? (
                            <>
                                <Button
                                    variant="ghost"
                                    onClick={cancelEditing}
                                    disabled={isSaving}
                                >
                                    <X className="mr-2 size-4" />
                                    Cancel
                                </Button>

                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? (
                                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                                    ) : (
                                        <Check className="mr-2 size-4" />
                                    )}
                                    Save changes
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button
                                    variant="destructive"
                                    onClick={() => setDeleteDialogOpen(true)}
                                >
                                    <Trash2 className="mr-2 size-4" />
                                    Delete issue
                                </Button>

                                <Button onClick={() => setIsEditing(true)}>
                                    <Pencil className="mr-2 size-4" />
                                    Edit issue
                                </Button>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AlertDialog
                open={deleteDialogOpen}
                onOpenChange={(nextOpen) => {
                    if (!isDeleting) setDeleteDialogOpen(nextOpen);
                }}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete this issue?</AlertDialogTitle>

                        <AlertDialogDescription>
                            This will permanently delete{" "}
                            <span className="font-medium text-foreground">
                                {projectKey}-{issue.issue_number}: {issue.title}
                            </span>
                            . This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>
                            Cancel
                        </AlertDialogCancel>

                        <AlertDialogAction
                            onClick={(event) => {
                                event.preventDefault();
                                handleDelete();
                            }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            Delete issue
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
