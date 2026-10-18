
import Link from "next/link";
import SignupForm from "@/components/auth/signup-form";

export default function SignupPage() {
    return (
        <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-10">
            <div className="w-full max-w-md">
                <Link
                    href="/"
                    className="mb-8 flex items-center justify-center gap-2"
                >
                    <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                        <span className="text-lg font-bold">T</span>
                    </span>
                    <span className="text-xl font-semibold tracking-tight">
                        TaskFlow
                    </span>
                </Link>

                <SignupForm />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/login"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Sign in
                    </Link>
                </p>
            </div>
        </main>
    );
}
