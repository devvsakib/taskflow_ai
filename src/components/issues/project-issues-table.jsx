
"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LayoutGrid, List } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IssueDetailsDialog } from "@/components/issues/issue-details-dialog";
import { IssueKanbanBoard } from "@/components/issues/issue-kanban-board";

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

const statusStyles = {
    backlog: "bg-muted text-muted-foreground",
    todo: "bg-slate-500/10 text-slate-600 dark:text-slate-300",
    in_progress: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    in_review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
    done: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
};

const priorityStyles = {
    urgent: "bg-red-500/10 text-red-600 dark:text-red-400",
    high: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    low: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    none: "bg-muted text-muted-foreground",
};

function formatLabel(value, options) {
    return options.find((option) => option.value === value)?.label ?? value;
}

function formatDate(value) {
    if (!value) return "—";

    return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

export function ProjectIssuesTable({
    issues = [],
    projectId,
    organizationId,
    projectKey,
    members = [],
}) {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("all");
    const [priority, setPriority] = useState("all");
    const [assignee, setAssignee] = useState("all");
    const [selectedIssue, setSelectedIssue] = useState({});
    const [view, setView] = useState("list");

    const filteredIssues = useMemo(() => {
        const query = search.trim().toLowerCase();

        return issues.filter((issue) => {
            const issueKey = `${projectKey}-${issue.issue_number}`;

            const matchesSearch =
                !query ||
                issue.title?.toLowerCase().includes(query) ||
                issueKey.toLowerCase().includes(query) ||
                String(issue.issue_number).includes(query);

            const matchesStatus =
                status === "all" || issue.status === status;

            const matchesPriority =
                priority === "all" || issue.priority === priority;

            const matchesAssignee =
                assignee === "all" ||
                (assignee === "unassigned"
                    ? !issue.assignee_id
                    : issue.assignee_id === assignee);

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesAssignee
            );
        });
    }, [issues, search, status, priority, assignee, projectKey]);

    const hasFilters =
        search.trim() ||
        status !== "all" ||
        priority !== "all" ||
        assignee !== "all";

    function clearFilters() {
        setSearch("");
        setStatus("all");
        setPriority("all");
        setAssignee("all");
    }

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center justify-between gap-3">

                    <div className="flex items-center rounded-lg border p-1">
                        <Button
                            type="button"
                            size="sm"
                            variant={view === "list" ? "secondary" : "ghost"}
                            onClick={() => setView("list")}
                        >
                            <List className="mr-2 size-4" />
                            List
                        </Button>

                        <Button
                            type="button"
                            size="sm"
                            variant={view === "board" ? "secondary" : "ghost"}
                            onClick={() => setView("board")}
                        >
                            <LayoutGrid className="mr-2 size-4" />
                            Board
                        </Button>
                    </div>
                </div>
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search issues by title or ID..."
                        className="pl-9"
                        aria-label="Search issues"
                    />
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 lg:w-auto">
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full sm:w-[145px]">
                            <SelectValue placeholder="All statuses" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            {statuses.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full sm:w-[145px]">
                            <SelectValue placeholder="All priorities" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {priorities.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={assignee} onValueChange={setAssignee}>
                        <SelectTrigger className="w-full sm:w-[165px]">
                            <SelectValue placeholder="All assignees" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.full_name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {hasFilters && (
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={clearFilters}
                        className="shrink-0"
                    >
                        <X className="mr-2 size-4" />
                        Clear
                    </Button>
                )}
            </div>

            <div className="text-sm text-muted-foreground">
                Showing {filteredIssues.length} of {issues.length} issues
            </div>

            <div className="overflow-hidden rounded-lg border">
                {view === "board" ? (
                    <IssueKanbanBoard
                        issues={filteredIssues}
                        projectId={projectId}
                        organizationId={organizationId}
                        projectKey={projectKey}
                        members={members}
                        onSelectIssue={setSelectedIssue}
                    />
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[120px]">Issue</TableHead>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Priority</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead className="whitespace-nowrap">Due date</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {filteredIssues.map((issue) => {
                                const assignedMember = members.find(
                                    (member) => member.id === issue.assignee_id
                                );

                                return (
                                    <TableRow
                                        key={issue.id}
                                        className="cursor-pointer"
                                        onClick={() => setSelectedIssue(issue)}
                                    >
                                        <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                            {projectKey}-{issue.issue_number}
                                        </TableCell>

                                        <TableCell className="min-w-[180px] font-medium">
                                            {issue.title}
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={statusStyles[issue.status] || ""}
                                            >
                                                {formatLabel(issue.status, statuses)}
                                            </Badge>
                                        </TableCell>

                                        <TableCell>
                                            <Badge
                                                variant="secondary"
                                                className={priorityStyles[issue.priority] || ""}
                                            >
                                                {formatLabel(issue.priority, priorities)}
                                            </Badge>
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap">
                                            {assignedMember?.full_name || "Unassigned"}
                                        </TableCell>

                                        <TableCell className="whitespace-nowrap text-muted-foreground">
                                            {formatDate(issue.due_date)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}

                            {filteredIssues.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-28 text-center text-muted-foreground"
                                    >
                                        {issues.length === 0
                                            ? "No issues yet. Create your first issue."
                                            : "No issues match your search or filters."}
                                        {issues.length > 0 && hasFilters && (
                                            <div className="mt-2">
                                                <Button
                                                    variant="link"
                                                    onClick={clearFilters}
                                                    className="h-auto p-0"
                                                >
                                                    Clear filters
                                                </Button>
                                            </div>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>

            <IssueDetailsDialog
                key={selectedIssue?.id || "no-selected-issue"}
                issue={selectedIssue}
                projectId={projectId}
                organizationId={organizationId}
                projectKey={projectKey}
                members={members}
                open={Boolean(selectedIssue)}
                onOpenChange={(open) => {
                    if (!open) setSelectedIssue(null);
                }}
            />
        </div>
    );
}
