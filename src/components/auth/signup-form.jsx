
"use client";

import { useState } from "react";
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
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";

import { CheckCircle2, LoaderCircle, Mail, TriangleAlert } from "lucide-react";

export default function SignupForm() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(event) {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");
        setIsLoading(true);

        try {
            const supabase = createClient();

            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                    },
                    emailRedirectTo: `${window.location.origin}/auth/callback`,
                },
            });

            if (error) {
                setErrorMessage(error.message);
                return;
            }

            if (data.session) {
                window.location.assign("/dashboard");
                return;
            }

            setSuccessMessage(
                "Your account has been created. Check your inbox for the confirmation link to activate your account."
            );
        } catch {
            setErrorMessage("Something went wrong. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    if (successMessage) {
        return (
            <Card className="border-border/70 shadow-sm">
                <CardContent className="flex flex-col items-center px-6 py-10 text-center">
                    <div className="mb-5 flex size-14 items-center justify-center rounded-full bg-emerald-500/10">
                        <Mail className="size-7 text-emerald-600" />
                    </div>

                    <CardTitle className="text-xl">
                        Check your email
                    </CardTitle>

                    <CardDescription className="mt-2 max-w-sm leading-6">
                        We&apos;ve sent a confirmation link to{" "}
                        <span className="font-medium text-foreground">{email.trim()}</span>.
                        Open the email and confirm your address to continue to TaskFlow.
                    </CardDescription>

                    <Alert className="mt-6 text-left">
                        <CheckCircle2 className="size-4" />
                        <AlertDescription>
                            {successMessage}
                        </AlertDescription>
                    </Alert>

                    <Button
                        type="button"
                        variant="outline"
                        className="mt-6 w-full"
                        onClick={() => {
                            setSuccessMessage("");
                            setPassword("");
                        }}
                    >
                        Back to sign up
                    </Button>

                    <p className="mt-4 text-sm text-muted-foreground">
                        Didn&apos;t receive the email? Check your spam folder.
                    </p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-border/70 shadow-sm">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl tracking-tight">
                    Create your account
                </CardTitle>
                <CardDescription>
                    Get started with your TaskFlow workspace.
                </CardDescription>
            </CardHeader>

            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="fullName">Full name</Label>
                        <Input
                            id="fullName"
                            name="fullName"
                            type="text"
                            autoComplete="name"
                            placeholder="Alex Morgan"
                            maxLength={100}
                            required
                            value={fullName}
                            onChange={(event) => setFullName(event.target.value)}
                        />
                    </div>

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

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="new-password"
                            placeholder="At least 8 characters"
                            minLength={8}
                            required
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Use at least 8 characters.
                        </p>
                    </div>

                    {errorMessage && (
                        <Alert variant="destructive">
                            <TriangleAlert className="size-4" />
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
                        {isLoading ? "Creating account..." : "Create account"}
                    </Button>

                    <p className="text-center text-xs leading-5 text-muted-foreground">
                        By creating an account, you agree to use TaskFlow responsibly.
                    </p>
                </form>
            </CardContent>
        </Card>
    );
}
