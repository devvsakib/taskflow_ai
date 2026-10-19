
"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { LoaderCircle, MailCheck } from "lucide-react";

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
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        setIsLoading(true);
        setErrorMessage("");

        try {
            const supabase = createClient();

            const { error } = await supabase.auth.resetPasswordForEmail(
                email.trim(),
                {
                    redirectTo: `${window.location.origin}/reset-password`,
                }
            );

            if (error) {
                setErrorMessage("Unable to send the recovery email. Please try again.");
                return;
            }

            setIsSubmitted(true);
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
                            Forgot your password?
                        </CardTitle>
                        <CardDescription>
                            Enter your account email and we&apos;ll send you a password
                            reset link.
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        {isSubmitted ? (
                            <div className="space-y-4">
                                <Alert>
                                    <MailCheck className="size-4" />
                                    <AlertDescription>
                                        If an account exists for that email, a recovery
                                        link will be sent. Check your inbox and spam folder.
                                    </AlertDescription>
                                </Alert>
                                <Button
                                    className="w-full"
                                    variant="outline"
                                    onClick={() => setIsSubmitted(false)}
                                >
                                    Try another email
                                </Button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        required
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                    />
                                </div>

                                {errorMessage && (
                                    <Alert variant="destructive">
                                        <AlertDescription>{errorMessage}</AlertDescription>
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
                                    {isLoading ? "Sending link..." : "Send recovery link"}
                                </Button>
                            </form>
                        )}

                        <p className="mt-5 text-center text-sm text-muted-foreground">
                            Remember your password?{" "}
                            <Link
                                href="/login"
                                className="font-medium text-primary underline-offset-4 hover:underline"
                            >
                                Back to sign in
                            </Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
