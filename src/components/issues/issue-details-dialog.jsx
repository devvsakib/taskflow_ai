"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, Pencil } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statuses = [
    { value: "backlog", label: "Backlog" },
    { value: "todo", label: "Todo" },
    { value: "in_progress", label: "In Progress" },
    { value: "in_review", label: "In Review" },
    { value: "done", label: "Done" },
];

const priorities = [
    { value: "urgent", label: "Urgent" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
    { value: "none", label: "None" },
];

export function IssueDetailsDialog({
    issue,
    projectId,
    organizationId,
    projectKey,
    members = [],
}) {
    const router = useRouter();

    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState(issue?.title);
    const [description, setDescription] = useState(issue?.description || "");
    const [status, setStatus] = useState(issue?.status);
    const [priority, setPriority] = useState(issue?.priority);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [assigneeId, setAssigneeId] = useState(
        issue?.assignee_id || "unassigned"
    );

    useEffect(() => {
        if (open) {
            setTitle(issue.title);
            setDescription(issue.description || "");
            setStatus(issue.status);
            setPriority(issue.priority);
            setError("");
            setAssigneeId(issue.assignee_id || "unassigned");
        }
    }, [open, issue]);

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError("Issue title is required.");
            return;
        }

        if (trimmedTitle.length > 200) {
            setError("Title must be 200 characters or fewer.");
            return;
        }

        if (description.length > 5000) {
            setError("Description must be 5,000 characters or fewer.");
            return;
        }

        setIsSaving(true);
        setError("");

        try {
            const supabase = createClient();

            const { data, error: updateError } = await supabase
                .from("issues")
                .update({
                    title: trimmedTitle,
                    description: description.trim() || null,
                    status,
                    priority,
                    assignee_id: assigneeId === "unassigned" ? null : assigneeId,
                })
                .eq("id", issue.id)
                .eq("project_id", projectId)
                .eq("organization_id", organizationId)
                .select("id")
                .maybeSingle();

            if (updateError) {
                if (updateError.code === "42501") {
                    toast.error("You don't have permission to update this issue.");
                }

                toast.error(updateError.message || "Couldn't update the issue.");
            }

            if (!data) {
                toast.error(
                    "The issue wasn't updated. Check your workspace membership and Supabase update policy."
                );
            }

            setOpen(false);
            router.refresh();
        } catch (err) {
            setError(err.message || "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    className="h-auto justify-start whitespace-normal p-0 text-left font-medium hover:text-primary"
                >
                    {issue.title}
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[560px]">
                <DialogHeader>
                    <p className="text-xs font-medium text-muted-foreground">
                        {projectKey}-{issue.issue_number}
                    </p>

                    <DialogTitle>Edit issue</DialogTitle>

                    <DialogDescription>
                        Update the issue details and track its progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor={`issue-title-${issue.id}`}>Title</Label>

                        <Input
                            id={`issue-title-${issue.id}`}
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={200}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor={`issue-description-${issue.id}`}>
                            Description
                        </Label>

                        <Textarea
                            id={`issue-description-${issue.id}`}
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            placeholder="Add details or acceptance criteria..."
                            maxLength={5000}
                            rows={5}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Status</Label>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>

                                <SelectContent>
                                    {statuses.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Priority</Label>

                            <Select value={priority} onValueChange={setPriority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>

                                <SelectContent>
                                    {priorities.map((item) => (
                                        <SelectItem key={item.value} value={item.value}>
                                            {item.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Assignee</Label>

                            <Select value={assigneeId} onValueChange={setAssigneeId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose an assignee" />
                                </SelectTrigger>

                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>

                                    {members.map((member) => (
                                        <SelectItem key={member.id} value={member.id}>
                                            {member.full_name}
                                            {member.id === issue.assignee_id ? " (Current)" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {error && (
                        <p role="alert" className="text-sm text-destructive">
                            {error}
                        </p>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSaving}>
                            {isSaving ? (
                                <>
                                    <LoaderCircle className="mr-2 size-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Pencil className="mr-2 size-4" />
                                    Save changes
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}