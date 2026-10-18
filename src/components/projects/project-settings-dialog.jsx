
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export function ProjectSettingsDialog({ project, role }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [name, setName] = useState(project.name || "");
    const [key, setKey] = useState(project.key || "");
    const [description, setDescription] = useState(
        project.description || ""
    );
    console.log(project)

    const canManage = ["owner", "admin"].includes(role);

    useEffect(() => {
        if (!open) return;

        setName(project.name || "");
        setKey(project.key || "");
        setDescription(project.description || "");
    }, [open, project]);

    async function handleSave(event) {
        event.preventDefault();

        if (!canManage) {
            toast.error("Only workspace owners and admins can edit projects.");
            return;
        }

        const trimmedName = name.trim();
        const normalizedKey = key.trim().toUpperCase();
        const trimmedDescription = description.trim();

        if (!trimmedName) {
            toast.error("Project name is required.");
            return;
        }

        if (!/^[A-Z][A-Z0-9]{1,9}$/.test(normalizedKey)) {
            toast.error(
                "Project key must be 2–10 characters, start with a letter, and contain only letters and numbers."
            );
            return;
        }

        if (!project?.id || !project?.organization_id) {
            toast.error("Project information is incomplete. Please refresh the page.");
            return;
        }

        setIsSaving(true);

        try {
            const supabase = createClient();

            const { data, error } = await supabase
                .from("projects")
                .update({
                    name: trimmedName,
                    key: normalizedKey,
                    description: trimmedDescription || null,
                })
                .eq("id", project.id)
                .eq("organization_id", project.organization_id)
                .select("id")
                .maybeSingle();

            if (error) {
                if (error.code === "23505") {
                    toast.error("That project key is already in use.");
                } else if (error.code === "42501") {
                    toast.error("You don't have permission to edit this project.");
                } else {
                    toast.error("Couldn't save project settings. Please try again.");
                }
                return;
            }

            if (!data) {
                toast.error(
                    "The project wasn't updated. Check your workspace permissions."
                );
                return;
            }

            toast.success("Project settings saved.");
            setOpen(false);
            router.refresh();
        } catch {
            toast.error("Something went wrong while saving project settings.");
        } finally {
            setIsSaving(false);
        }
    }

    if (!canManage) return null;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Settings2 className="mr-2 size-4" />
                    Project settings
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[520px]">
                <form onSubmit={handleSave}>
                    <DialogHeader>
                        <DialogTitle>Project settings</DialogTitle>
                        <DialogDescription>
                            Update this project's name, identifier, and description.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-5">
                        <div className="space-y-2">
                            <label
                                htmlFor="project-name"
                                className="text-sm font-medium"
                            >
                                Project name
                            </label>
                            <Input
                                id="project-name"
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                maxLength={100}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="project-key"
                                className="text-sm font-medium"
                            >
                                Project key
                            </label>
                            <Input
                                id="project-key"
                                value={key}
                                onChange={(event) =>
                                    setKey(event.target.value.toUpperCase())
                                }
                                maxLength={10}
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Issue identifiers use this key, for example{" "}
                                {key.trim().toUpperCase() || "TASK"}-1.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="project-description"
                                className="text-sm font-medium"
                            >
                                Description
                            </label>
                            <Textarea
                                id="project-description"
                                value={description}
                                onChange={(event) => setDescription(event.target.value)}
                                placeholder="What is this project about?"
                                rows={4}
                            />
                        </div>
                    </div>

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
                            {isSaving && (
                                <LoaderCircle className="mr-2 size-4 animate-spin" />
                            )}
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
