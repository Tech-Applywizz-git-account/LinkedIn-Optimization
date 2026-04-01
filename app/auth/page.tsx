"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.message.includes("Email not confirmed")) {
            setError("Please verify your email first. Check your inbox (and spam folder).");
          } else if (error.message.includes("Invalid login credentials")) {
            setError("Incorrect email or password. Please try again.");
          } else {
            throw error;
          }
          return;
        }
        router.push("/");
        router.refresh();

      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;

        if (data.session) {
          router.push("/");
          router.refresh();
          return;
        }

        setSuccess(
          "✅ Account created! A verification email has been sent to " + email +
          ". Please check your inbox (and spam folder), click the link, then come back to Sign In."
        );
        setMode("login");
        setPassword("");

      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset`,
        });
        if (error) throw error;
        setSuccess("✅ Password reset link sent to " + email + ". Check your inbox and spam folder.");
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Decorative Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-100 rounded-full blur-3xl opacity-60" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-100 rounded-full blur-3xl opacity-60" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">

          {/* Logo & Brand */}
          <div className="text-center mb-8">
            <img src="/logo.png" alt="ApplyWizz Logo" className="w-16 h-16 mx-auto object-contain rounded-xl" />
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-4">ApplyWizz</h1>
            <p className="text-slate-500 text-sm mt-1">LinkedIn Optimization Platform</p>
          </div>

          {/* Tab switcher */}
          {mode !== "forgot" && (
            <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
              {(["login", "signup"] as Mode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                  suppressHydrationWarning
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    mode === m
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {m === "login" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>
          )}

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-900">
              {mode === "login" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset Password"}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              {mode === "login"
                ? "Sign in to continue optimizing your LinkedIn profile"
                : mode === "signup"
                ? "Start creating a standout LinkedIn profile today"
                : "We'll send you a link to reset your password"}
            </p>
          </div>

          {/* Feedback */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  suppressHydrationWarning
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                suppressHydrationWarning
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              />
            </div>

            {mode !== "forgot" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  suppressHydrationWarning
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            )}

            {mode === "login" && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => { setMode("forgot"); setError(null); setSuccess(null); }}
                  suppressHydrationWarning
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium transition"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              suppressHydrationWarning
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
              ) : null}
              {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Send Reset Link"}
            </button>
          </form>

          {/* Divider + Google */}
          {mode !== "forgot" && (
            <>
              <div className="flex items-center gap-4 my-5">
                <div className="flex-1 h-px bg-slate-100" />
                <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">or continue with</span>
                <div className="flex-1 h-px bg-slate-100" />
              </div>

              <button
                onClick={handleGoogle}
                suppressHydrationWarning
                className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-sm"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Google
              </button>
            </>
          )}

          {/* Forgot password back */}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => { setMode("login"); setError(null); setSuccess(null); }}
              className="w-full mt-4 text-sm text-slate-500 hover:text-slate-900 transition text-center"
            >
              ← Back to Sign In
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
            <p className="text-slate-400 text-xs mb-2">
              By using ApplyWizz, you agree to our <span className="underline cursor-pointer">Terms</span> & <span className="underline cursor-pointer">Privacy</span>
            </p>
            <p className="text-slate-300 text-[10px]">
              &copy; {new Date().getFullYear()} ApplyWizz. All rights reserved.
            </p>
        </div>
      </div>
    </div>
  );
}
