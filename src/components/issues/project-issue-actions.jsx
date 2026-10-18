"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { CreateIssueDialog } from "@/components/issues/create-issue-dialog";

export function ProjectIssueActions({ projectId, organizationId, members = [] }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreateIssue = async (issue) => {
        setIsSubmitting(true);

        try {
            const supabase = createClient();

            const {
                data: { user },
                error: authError,
            } = await supabase.auth.getUser();

            if (authError || !user) {
                toast.error("Your session has expired. Please log in again.");
                return;
            }

            const { error } = await supabase.from("issues").insert({
                organization_id: organizationId,
                project_id: projectId,
                title: issue.title,
                description: issue.description || null,
                status: issue.status,
                priority: issue.priority,
                due_date: issue.due_date,
                assignee_id: issue.assignee_id,
                created_by: user.id,
            });

            if (error) {
                toast.error(
                    error.code === "42501"
                        ? "You don't have permission to create issues here."
                        : "Couldn't create the issue. Please try again."
                );
                return;
            }

            toast.success("Issue created successfully!");
            setOpen(false);
            router.refresh();
        } catch {
            toast.error("Something went wrong while creating the issue.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 size-4" />
                Create issue
            </Button>

            <CreateIssueDialog
                open={open}
                onOpenChange={setOpen}
                onCreateIssue={handleCreateIssue}
                isSubmitting={isSubmitting}
                members={members}
            />
        </>
    );
}