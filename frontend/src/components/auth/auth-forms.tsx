"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Mode = "login" | "register" | "forgot" | "reset";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      if (mode === "login") {
        await auth.signInWithEmail(email, password);
        router.push("/dashboard");
      }
      if (mode === "register") {
        await auth.signUpWithEmail(email, password, displayName);
        setMessage("Check your email to confirm your account.");
      }
      if (mode === "forgot") {
        await auth.sendPasswordReset(email);
        setMessage("Password reset email sent.");
      }
      if (mode === "reset") {
        await auth.resetPassword(password);
        router.push("/dashboard");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const title = { login: "Welcome back", register: "Create account", forgot: "Reset your password", reset: "Choose a new password" }[mode];

  return (
    <main className="grid min-h-screen place-items-center bg-[#faf9f6] px-6 text-stone-950 dark:bg-stone-950 dark:text-stone-50">
      <Card className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === "register" && <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Display name" required />}
          {mode !== "reset" && <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email" required />}
          {mode !== "forgot" && <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Password" required minLength={8} />}
          {message && <p className="rounded-lg bg-stone-100 p-3 text-sm text-stone-600 dark:bg-stone-900 dark:text-stone-300">{message}</p>}
          <Button className="w-full" disabled={submitting || auth.isLoading}>{submitting ? "Please wait..." : title}</Button>
        </form>
        {(mode === "login" || mode === "register") && (
          <Button className="mt-3 w-full" variant="secondary" onClick={() => auth.signInWithGoogle()} type="button">
            Continue with Google
          </Button>
        )}
        <div className="mt-5 flex justify-between text-sm text-stone-500">
          <Link href="/login">Login</Link>
          <Link href="/register">Register</Link>
          <Link href="/forgot-password">Forgot?</Link>
        </div>
      </Card>
    </main>
  );
}
