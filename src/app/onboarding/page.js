
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateWorkspaceForm from "@/components/workspace/create-workspace-form";

export default async function OnboardingPage() {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (error || !userId) {
        redirect("/login");
    }

    const { data: memberships, error: membershipError } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", userId)
        .limit(1);

    if (membershipError) {
        throw new Error("Unable to load your workspace memberships.");
    }

    if (memberships?.length) {
        redirect("/dashboard");
    }

    return (
        <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-background px-4 py-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background" />

            <div className="relative w-full max-w-md">
                <div className="mb-8 flex items-center justify-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <span className="text-lg font-bold">T</span>
                    </div>

                    <span className="text-xl font-semibold tracking-tight">
                        TaskFlow
                    </span>
                </div>

                <CreateWorkspaceForm />

                <p className="mt-6 text-center text-xs text-muted-foreground">
                    A focused workspace for work that moves forward.
                </p>
            </div>
        </main>
    );
}
