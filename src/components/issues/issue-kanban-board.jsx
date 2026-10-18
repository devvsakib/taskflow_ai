"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { CalendarDays, GripVertical, LoaderCircle } from "lucide-react";
import { statusConfig, priorityConfig } from "@/lib/issues/issue-config";

const columns = [
  { id: "backlog", label: "Backlog", color: "bg-muted-foreground" },
  { id: "todo", label: "To do", color: "bg-slate-500" },
  { id: "in_progress", label: "In progress", color: "bg-blue-500" },
  { id: "in_review", label: "In review", color: "bg-amber-500" },
  { id: "done", label: "Done", color: "bg-emerald-500" },
];

const priorityStyles = {
  urgent: "border-red-500/30 text-red-600 dark:text-red-400",
  high: "border-orange-500/30 text-orange-600 dark:text-orange-400",
  medium: "border-yellow-500/30 text-yellow-700 dark:text-yellow-400",
  low: "border-blue-500/30 text-blue-600 dark:text-blue-400",
  none: "border-border text-muted-foreground",
};

function getInitials(name) {
  return (name || "Member")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function IssueCard({ issue, projectKey, members, onSelect, isUpdating }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: issue.id,
      data: { status: issue.status },
      disabled: isUpdating,
    });

  const assignee = members.find(
    (member) => member.id === issue.assignee_id
  );

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border bg-card p-3 shadow-sm",
        "transition-[border-color,box-shadow,opacity] duration-150",
        "hover:border-primary/40 hover:shadow-md",
        isDragging && "border-primary/40"
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">
          {projectKey}-{issue.issue_number}
        </span>

        <button
          type="button"
          aria-label="Drag issue"
          className="touch-none rounded p-1 text-muted-foreground opacity-60 hover:bg-muted hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      </div>

      <button
        type="button"
        className="mb-3 block w-full text-left text-sm font-medium leading-5 hover:text-primary"
        onClick={() => onSelect(issue)}
      >
        {issue.title}
      </button>

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className={cn(
            "text-[10px] capitalize",
            priorityConfig[issue.priority].className || priorityStyles.none
          )}
        >
          <div className="space-x-1">
            <span>{priorityConfig[issue.priority].icon}</span>
            <span>{priorityConfig[issue.priority].label}</span>
          </div>
        </Badge>

        {issue.due_date && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <CalendarDays className="size-3" />
            {new Date(`${issue.due_date}T00:00:00`).toLocaleDateString(
              undefined,
              { month: "short", day: "numeric" }
            )}
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between border-t pt-2">
        <span className="truncate pr-2 text-xs text-muted-foreground">
          {assignee?.full_name || "Unassigned"}
        </span>

        <Avatar className="size-6 shrink-0">
          <AvatarImage
            src={assignee?.avatar_url || undefined}
            alt={assignee?.full_name || "Unassigned"}
          />
          <AvatarFallback className="text-[9px]">
            {assignee ? getInitials(assignee.full_name) : "—"}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}

function BoardColumn({
  column,
  issues,
  projectKey,
  members,
  onSelect,
  updatingIds,
}) {
  const { isOver, setNodeRef } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[280px] min-w-[260px] flex-1 flex-col rounded-xl border bg-muted/30 p-3 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={cn("size-2 rounded-full", column.color)} />
          <h3 className="text-sm font-semibold">{column.label}</h3>
        </div>

        <Badge variant="secondary" className="min-w-6 justify-center">
          {issues.length}
        </Badge>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {issues.map((issue) => (
          <div key={issue.id} className="relative">
            <IssueCard
              issue={issue}
              projectKey={projectKey}
              members={members}
              onSelect={onSelect}
              isUpdating={updatingIds.has(issue.id)}
            />

            {updatingIds.has(issue.id) && (
              <div className="absolute right-2 top-2 rounded-full bg-background p-1">
                <LoaderCircle className="size-4 animate-spin text-primary" />
              </div>
            )}
          </div>
        ))}

        {issues.length === 0 && (
          <div className="flex min-h-20 flex-1 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
            Drop issues here
          </div>
        )}
      </div>
    </div>
  );
}


export function IssueKanbanBoard({
  issues = [],
  projectId,
  organizationId,
  projectKey,
  members = [],
  onSelectIssue,
}) {
  const [boardIssues, setBoardIssues] = useState(issues);
  const [activeIssue, setActiveIssue] = useState(null);
  const [updatingIds, setUpdatingIds] = useState(() => new Set());

  useEffect(() => {
    setBoardIssues(issues);
  }, [issues]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  function handleDragStart(event) {
    const issue = boardIssues.find(
      (item) => item.id === event.active.id
    );

    setActiveIssue(issue || null);
  }

  async function handleDragEnd(event) {
    setActiveIssue(null);

    const { active, over } = event;
    if (!over) return;

    const issue = boardIssues.find(
      (item) => item.id === active.id
    );

    // Allow dropping onto either a column or another issue card.
    const overIssue = boardIssues.find(
      (item) => item.id === over.id
    );

    const targetColumn =
      columns.find((item) => item.id === over.id) ||
      columns.find((item) => item.id === overIssue?.status);

    if (
      !issue ||
      !targetColumn ||
      issue.status === targetColumn.id ||
      updatingIds.has(issue.id)
    ) {
      return;
    }

    const previousStatus = issue.status;
    const nextStatus = targetColumn.id;

    // Move the card immediately, before contacting Supabase.
    setBoardIssues((current) =>
      current.map((item) =>
        item.id === issue.id
          ? { ...item, status: nextStatus }
          : item
      )
    );

    setUpdatingIds((current) => new Set(current).add(issue.id));

    try {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("issues")
        .update({ status: nextStatus })
        .eq("id", issue.id)
        .eq("project_id", projectId)
        .eq("organization_id", organizationId)
        .select("id")
        .maybeSingle();

      if (error || !data) {
        setBoardIssues((current) =>
          current.map((item) =>
            item.id === issue.id
              ? { ...item, status: previousStatus }
              : item
          )
        );

        toast.error(
          error?.code === "42501"
            ? "You don't have permission to update this issue."
            : "Couldn't update the issue status. Please try again."
        );
        return;
      }

      toast.success(`Moved to ${targetColumn.label}`);
    } catch {
      setBoardIssues((current) =>
        current.map((item) =>
          item.id === issue.id
            ? { ...item, status: previousStatus }
            : item
        )
      );

      toast.error("Something went wrong while moving the issue.");
    } finally {
      setUpdatingIds((current) => {
        const next = new Set(current);
        next.delete(issue.id);
        return next;
      });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragCancel={() => setActiveIssue(null)}
      onDragEnd={handleDragEnd}
    >
      <div className="overflow-x-auto pb-3">
        <div className="flex min-w-max items-stretch gap-3 xl:min-w-0">
          {columns.map((column) => (
            <BoardColumn
              key={column.id}
              column={column}
              issues={boardIssues.filter(
                (issue) => issue.status === column.id
              )}
              projectKey={projectKey}
              members={members}
              onSelect={onSelectIssue}
              updatingIds={updatingIds}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue ? (
          <div className="w-[260px] rotate-[2deg] cursor-grabbing rounded-xl border border-primary/40 bg-card p-4 shadow-2xl ring-1 ring-primary/10">
            <p className="mb-2 font-mono text-xs text-muted-foreground">
              {projectKey}-{activeIssue.issue_number}
            </p>

            <p className="text-sm font-semibold leading-5">
              {activeIssue.title}
            </p>

            <div className="mt-3 flex items-center justify-between gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize",
                  priorityStyles[activeIssue.priority] ||
                  priorityStyles.none
                )}
              >
                {activeIssue.priority === "none"
                  ? "No priority"
                  : activeIssue.priority}
              </Badge>

              <span className="text-xs text-muted-foreground">
                {columns.find(
                  (column) => column.id === activeIssue.status
                )?.label}
              </span>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
