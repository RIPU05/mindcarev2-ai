"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, ArrowRight } from "lucide-react";

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
        setMessage("Account created. Check your email to confirm if required.");
      }
      if (mode === "forgot") {
        await auth.sendPasswordReset(email);
        setMessage("Password reset email sent successfully.");
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

  const title = {
    login: "Welcome back",
    register: "Create your account",
    forgot: "Reset your password",
    reset: "Choose a new password"
  }[mode];

  const subtitle = {
    login: "Sign in to access your serene reflection space",
    register: "Start your calm mental health journey today",
    forgot: "We'll send you instructions to reset your password",
    reset: "Set a strong new password for your account"
  }[mode];

  return (
    <main className="relative grid min-h-screen place-items-center bg-slate-50/80 px-6 py-12 text-slate-900 dark:bg-slate-950 dark:text-slate-50 overflow-hidden">
      {/* Background Glow Elements */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-400/20 blur-3xl dark:bg-emerald-600/15 animate-ambient" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-teal-400/20 blur-3xl dark:bg-teal-600/15 animate-ambient" style={{ animationDelay: "4s" }} />

      <Card className="glass-panel w-full max-w-md p-8 sm:p-10 border border-slate-200/80 shadow-2xl dark:border-slate-800">
        {/* Brand Emblem Header */}
        <div className="mb-6 flex items-center justify-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 text-white shadow-lg shadow-emerald-500/30">
            <Sparkles className="size-6" />
          </span>
          <div className="text-left">
            <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              MindCare <span className="text-emerald-600 dark:text-emerald-400">AI</span>
            </span>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Calm Intelligence
            </p>
          </div>
        </div>

        <h1 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h1>
        <p className="mt-1 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
          {subtitle}
        </p>

        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          {mode === "register" && (
            <Input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Display Name"
              className="h-12 rounded-xl text-sm"
              required
            />
          )}

          {mode !== "reset" && (
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              placeholder="Email address"
              className="h-12 rounded-xl text-sm"
              required
            />
          )}

          {mode !== "forgot" && (
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              placeholder="Password (min. 8 characters)"
              className="h-12 rounded-xl text-sm"
              required
              minLength={8}
            />
          )}

          {message && (
            <div className="rounded-xl border border-emerald-300/60 bg-emerald-50/80 p-3.5 text-center text-xs font-semibold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              {message}
            </div>
          )}

          <Button className="h-12 w-full text-base font-bold shadow-md shadow-emerald-500/20" disabled={submitting || auth.isLoading}>
            {submitting ? "Please wait..." : title} <ArrowRight className="size-4 ml-1" />
          </Button>
        </form>

        {(mode === "login" || mode === "register") && (
          <div className="mt-4">
            <div className="relative my-4 text-center text-xs text-slate-400">
              <span className="bg-white px-2 dark:bg-slate-900">Or continue with</span>
            </div>
            <Button
              className="h-12 w-full font-semibold"
              variant="secondary"
              onClick={() => auth.signInWithGoogle()}
              type="button"
            >
              Continue with Google
            </Button>
          </div>
        )}

        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-semibold text-slate-500 dark:border-slate-800">
          <Link href="/login" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Login
          </Link>
          <Link href="/register" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Register
          </Link>
          <Link href="/forgot-password" className="hover:text-emerald-600 dark:hover:text-emerald-400">
            Forgot password?
          </Link>
        </div>
      </Card>
    </main>
  );
}
