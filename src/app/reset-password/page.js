
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoaderCircle, TriangleAlert } from "lucide-react";

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

export default function ResetPasswordPage() {
    const router = useRouter();

    const [supabase] = useState(() => createClient());
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChecking, setIsChecking] = useState(true);
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        let active = true;

        async function checkSession() {
            const { data, error } = await supabase.auth.getSession();

            if (!active) return;

            if (!error && data.session) {
                setIsReady(true);
            } else {
                setErrorMessage(
                    "This recovery link is invalid or expired. Request a new one."
                );
            }

            setIsChecking(false);
        }

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;

            if (event === "PASSWORD_RECOVERY" && session) {
                setIsReady(true);
                setErrorMessage("");
                setIsChecking(false);
            }
        });

        checkSession();

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [supabase]);

    async function handleSubmit(event) {
        event.preventDefault();
        setErrorMessage("");

        if (password.length < 8) {
            setErrorMessage("Your password must be at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setErrorMessage("The passwords do not match.");
            return;
        }

        setIsLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password,
            });

            if (error) {
                setErrorMessage(
                    error.message || "Unable to update your password."
                );
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
        <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
            <div className="w-full max-w-md">
                <Card className="border-border/70 shadow-sm">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl tracking-tight">
                            Reset your password
                        </CardTitle>
                        <CardDescription>
                            Choose a new password for your TaskFlow account.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isChecking ? (
                            <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                                <LoaderCircle className="size-4 animate-spin" />
                                Verifying recovery link...
                            </div>
                        ) : !isReady ? (
                            <div className="space-y-4">
                                <Alert variant="destructive">
                                    <TriangleAlert className="size-4" />
                                    <AlertDescription>{errorMessage}</AlertDescription>
                                </Alert>
                                <Button asChild className="w-full">
                                    <Link href="/forgot-password">
                                        Request a new recovery link
                                    </Link>
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="password">New password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        placeholder="At least 8 characters"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">
                                        Confirm new password
                                    </Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        autoComplete="new-password"
                                        minLength={8}
                                        required
                                        value={confirmPassword}
                                        onChange={(event) =>
                                            setConfirmPassword(event.target.value)
                                        }
                                        placeholder="Re-enter your password"
                                    />
                                </div>

                                {errorMessage && (
                                    <Alert variant="destructive">
                                        <TriangleAlert className="size-4" />
                                        <AlertDescription>
                                            {errorMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading && (
                                        <LoaderCircle className="mr-2 size-4 animate-spin" />
                                    )}
                                    {isLoading ? "Updating password..." : "Update password"}
                                </Button>
                            </form>
                        )}
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
