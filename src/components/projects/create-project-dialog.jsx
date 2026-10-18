"use client";

import { useEffect, useState } from "react";
import { FolderPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

function generateProjectKey(name) {
    const words = name.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean);

    if (words.length > 1) {
        return words
            .map((word) => word[0])
            .join("")
            .toUpperCase()
            .slice(0, 6);
    }

    return (words[0] || "").toUpperCase().slice(0, 4);
}

export function CreateProjectDialog({
    open,
    onOpenChange,
    onCreateProject,
    isSubmitting = false,
}) {
    const [name, setName] = useState("");
    const [projectKey, setProjectKey] = useState("");
    const [description, setDescription] = useState("");
    const [keyEdited, setKeyEdited] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            setName("");
            setProjectKey("");
            setDescription("");
            setKeyEdited(false);
            setError("");
        }
    }, [open]);

    function handleNameChange(value) {
        setName(value);
        setError("");

        if (!keyEdited) {
            setProjectKey(generateProjectKey(value));
        }
    }

    function handleKeyChange(value) {
        setKeyEdited(true);
        setProjectKey(
            value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10)
        );
        setError("");
    }

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedName = name.trim();
        const trimmedKey = projectKey.trim();

        if (!trimmedName) {
            setError("Project name is required.");
            return;
        }

        if (trimmedName.length > 100) {
            setError("Project name must be 100 characters or fewer.");
            return;
        }

        if (!/^[A-Z0-9]{2,10}$/.test(trimmedKey)) {
            setError("Project key must be 2–10 letters or numbers.");
            return;
        }

        setError("");

        try {
            await onCreateProject({
                name: trimmedName,
                key: trimmedKey,
                description: description.trim(),
            });
        } catch (err) {
            setError(err.message || "Couldn't create the project. Please try again.");
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <FolderPlus className="size-5" />
                    </div>

                    <DialogTitle>Create a project</DialogTitle>
                    <DialogDescription>
                        Give your next initiative a home. You can organize and track its
                        issues once the project is created.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="project-name">Project name</Label>
                        <Input
                            id="project-name"
                            placeholder="Website redesign"
                            value={name}
                            onChange={(event) => handleNameChange(event.target.value)}
                            maxLength={100}
                            autoFocus
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-key">Project key</Label>
                        <Input
                            id="project-key"
                            placeholder="WR"
                            value={projectKey}
                            onChange={(event) => handleKeyChange(event.target.value)}
                            maxLength={10}
                            required
                        />
                        <p className="text-xs text-muted-foreground">
                            Used to identify issues, for example WR-1, WR-2, and WR-3.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="project-description">
                            Description <span className="text-muted-foreground">(optional)</span>
                        </Label>
                        <Textarea
                            id="project-description"
                            placeholder="What is this project about?"
                            value={description}
                            onChange={(event) => setDescription(event.target.value)}
                            maxLength={1000}
                            rows={3}
                            className="resize-none"
                        />
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
                            {isSubmitting ? "Creating..." : "Create project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}