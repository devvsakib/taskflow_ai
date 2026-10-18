
import Link from "next/link";
import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
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

                <LoginForm />

                <p className="mt-6 text-center text-sm text-muted-foreground">
                    Don&apos;t have an account?{" "}
                    <Link
                        href="/signup"
                        className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    );
}
