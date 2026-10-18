
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

import {
    ArrowRight,
    Building2,
    LoaderCircle,
    TriangleAlert,
} from "lucide-react";

function createSlug(value) {
    return value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60)
        .replace(/-+$/g, "");
}

export default function CreateWorkspaceForm() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage("");
        setIsLoading(true);

        try {
            const supabase = createClient();
            const slug = createSlug(name);

            if (!slug) {
                setErrorMessage("Please enter a valid workspace name.");
                return;
            }

            const { data, error } = await supabase.rpc(
                "create_organization",
                {
                    p_name: name.trim(),
                    p_slug: slug,
                }
            );

            if (error) {
                if (error.code === "23505") {
                    setErrorMessage(
                        "That workspace URL is already taken. Try a different name."
                    );
                } else {
                    setErrorMessage(
                        error.message || "Unable to create your workspace."
                    );
                }

                return;
            }

            if (!data) {
                setErrorMessage("The workspace could not be created. Please try again.");
                return;
            }

            router.replace("/dashboard");
            router.refresh();
        } catch {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Card className="border-border/70 shadow-xl shadow-primary/5">
            <CardHeader className="space-y-4">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <Building2 className="size-6" />
                </div>

                <div className="space-y-2">
                    <CardTitle className="text-2xl tracking-tight">
                        Create your workspace
                    </CardTitle>
                    <CardDescription className="leading-6">
                        Give your team a home for projects, tasks, and collaboration.
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="workspace-name">Workspace name</Label>

                        <Input
                            id="workspace-name"
                            placeholder="e.g. Acme Studio"
                            value={name}
                            onChange={(event) => setName(event.target.value)}
                            maxLength={100}
                            required
                            autoFocus
                        />

                        <p className="text-xs text-muted-foreground">
                            Choose a name your team will recognize.
                        </p>
                    </div>

                    {name.trim() && (
                        <div className="space-y-1.5">
                            <Label>Workspace URL slug</Label>
                            <div className="rounded-lg border bg-muted/40 px-3 py-2.5 font-mono text-sm text-muted-foreground">
                                {createSlug(name) || "your-workspace"}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                You can use this identifier when we add workspace URLs.
                            </p>
                        </div>
                    )}

                    {errorMessage && (
                        <Alert variant="destructive">
                            <TriangleAlert className="size-4" />
                            <AlertDescription>{errorMessage}</AlertDescription>
                        </Alert>
                    )}

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || !name.trim()}
                    >
                        {isLoading ? (
                            <>
                                <LoaderCircle className="size-4 animate-spin" />
                                Creating workspace...
                            </>
                        ) : (
                            <>
                                Create workspace
                                <ArrowRight className="size-4" />
                            </>
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
