"use client";

import { useEffect, useState } from "react";
import { CalendarIcon, LoaderCircle } from "lucide-react";
import { format } from "date-fns";

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
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
    { value: "none", label: "No priority" },
];

export function CreateIssueDialog({
    open,
    onOpenChange,
    onCreateIssue,
    members = [],
    isSubmitting = false,
}) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState("todo");
    const [priority, setPriority] = useState("medium");
    const [dueDate, setDueDate] = useState(undefined);
    const [error, setError] = useState("");
    const [assigneeId, setAssigneeId] = useState("unassigned");

    useEffect(() => {
        if (!open) {
            setTitle("");
            setDescription("");
            setStatus("todo");
            setPriority("medium");
            setDueDate(undefined);
            setAssigneeId("unassigned");
            setError("");
        }
    }, [open]);

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedTitle = title.trim();

        if (!trimmedTitle) {
            setError("Issue title is required.");
            return;
        }

        if (trimmedTitle.length > 200) {
            setError("Issue title must be 200 characters or fewer.");
            return;
        }

        setError("");

        try {
            await onCreateIssue({
                title: trimmedTitle,
                description: description.trim(),
                status,
                priority,
                due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : null,
                assignee_id: assigneeId === "unassigned" ? null : assigneeId,
            });
        } catch (err) {
            setError(err.message || "Couldn't create the issue. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[540px]">
                <DialogHeader>
                    <DialogTitle>Create an issue</DialogTitle>
                    <DialogDescription>
                        Break your project into actionable work and track its progress.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="issue-title">Title</Label>
                        <Input
                            id="issue-title"
                            placeholder="e.g. Build the authentication flow"
                            value={title}
                            onChange={(event) => setTitle(event.target.value)}
                            maxLength={200}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="issue-description">Description</Label>
                        <Textarea
                            id="issue-description"
                            placeholder="Add context, requirements, or acceptance criteria..."
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={5000}
                            rows={4}
                            className="resize-none"
                        />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose status" />
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
                                    <SelectValue placeholder="Choose priority" />
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
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Due date (optional)</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-start text-left font-normal"
                                >
                                    <CalendarIcon className="mr-2 size-4" />
                                    {dueDate ? format(dueDate, "PPP") : "Choose a due date"}
                                </Button>
                            </PopoverTrigger>

                            <PopoverContent align="start" className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={dueDate}
                                    onSelect={setDueDate}
                                    disabled={(date) => date < new Date("2000-01-01")}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>

                        {dueDate && (
                            <Button
                                type="button"
                                variant="link"
                                size="sm"
                                className="px-0"
                                onClick={() => setDueDate(undefined)}
                            >
                                Clear due date
                            </Button>
                        )}
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
                            onClick={() => onOpenChange(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>

                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            {isSubmitting ? "Creating..." : "Create issue"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}