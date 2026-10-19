"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

export default function AcceptInvitationForm() {
    const router = useRouter();
    const supabase = createClient();

    const [fullName, setFullName] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        const trimmedName = fullName.trim();

        if (!trimmedName) {
            toast.error("Please enter your full name.");
            return;
        }

        if (password.length < 8) {
            toast.error("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            // The invitation confirmation route should establish
            // an authenticated Supabase session before this page opens.
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError || !user) {
                toast.error("Your invitation session has expired. Please open a new invitation email.");
                router.replace("/login");
                return;
            }

            const { error: passwordError } = await supabase.auth.updateUser({
                password,
                data: {
                    full_name: trimmedName,
                },
            });

            if (passwordError) {
                toast.error(passwordError.message);
                return;
            }

            // Keep the profile name synchronized with Auth metadata.
            const { error: profileError } = await supabase
                .from("profiles")
                .upsert(
                    {
                        id: user.id,
                        full_name: trimmedName,
                        email: user.email,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "id" }
                );

            if (profileError) {
                console.error("Profile update failed:", profileError.message);
                toast.error("Your password was saved, but your profile could not be updated. Please try again.");
                return;
            }

            toast.success("Your account is ready!");

            router.replace("/dashboard");
            router.refresh();
        } catch (error) {
            console.error("Account setup failed:", error);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
            <Card className="w-full max-w-md">
                <CardHeader className="space-y-2">
                    <CardTitle className="text-2xl font-semibold tracking-tight">
                        Set up your account
                    </CardTitle>

                    <CardDescription>
                        Choose your name and password to get started with TaskFlow.
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full name</Label>
                            <Input
                                id="fullName"
                                placeholder="Alex Morgan"
                                autoComplete="name"
                                value={fullName}
                                onChange={(event) => setFullName(event.target.value)}
                                maxLength={100}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="At least 8 characters"
                                autoComplete="new-password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                minLength={8}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">
                                Confirm password
                            </Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Enter your password again"
                                autoComplete="new-password"
                                value={confirmPassword}
                                onChange={(event) =>
                                    setConfirmPassword(event.target.value)
                                }
                                minLength={8}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Setting up account..." : "Create account"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}