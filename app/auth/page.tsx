"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";

type Mode = "login" | "signup";
type Step = "email" | "otp" | "password";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<Mode>("login");
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [sigData, setSigData] = useState<{ sig: string; exp: number } | null>(null);
  const [sessionLink, setSessionLink] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // --- LOGIN FLOW ---
  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.includes("Invalid login credentials")) throw new Error("Incorrect email or password.");
        throw error;
      }
      router.push("/");
      router.refresh();
    } catch (err: any) { setError(err?.message); } finally { setLoading(false); }
  }

  // --- SIGNUP FLOW ---
  async function handleRequestOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null);
    try {
      const { data, error } = await supabase.functions.invoke('swift-endpoint', { body: { email } });
      if (error || data?.error) throw new Error(error?.message || data?.error || "Failed to send code.");
      setSigData({ sig: data.signature, exp: data.expiry });
      setStep("otp");
      setSuccess(`✅ Verification code sent to ${email}`);
    } catch (err: any) { setError(err?.message || "Something went wrong."); } finally { setLoading(false); }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('swift-endpoint', {
        body: { email, otp, type: 'verify', signature: sigData?.sig, expiry: sigData?.exp }
      });
      if (error || data?.error) throw new Error(error?.message || data?.error || "Invalid code.");
      if (data?.session_link) {
        setSessionLink(data.session_link);
        setUserId(data.user_id);
        setStep("password");
      }
    } catch (err: any) { setError(err?.message); } finally { setLoading(false); }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke('swift-endpoint', {
        body: { user_id: userId, type: 'set-password', password: newPassword }
      });
      if (error || data?.error) throw new Error(data?.error || "Failed to set password");
      window.location.href = sessionLink!;
    } catch (err: any) { setError(err?.message); setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ApplyWizz" className="w-16 h-16 mx-auto object-contain rounded-xl" />
          <h1 className="text-2xl font-bold text-slate-900 mt-4">ApplyWizz</h1>
          <p className="text-slate-500 text-sm">LinkedIn Optimization Platform</p>
        </div>

        {step === "email" && (
          <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
            {(["login", "signup"] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccess(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === m ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
                  }`}
              >
                {m === "login" ? "Login" : "Sign Up"}
              </button>
            ))}
          </div>
        )}

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">{success}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
            <button disabled={loading} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl">{loading ? "Logging in..." : "Login"}</button>
          </form>
        ) : (
          step === "email" ? (
            <form onSubmit={handleRequestOTP} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              <button disabled={loading} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl">{loading ? "Sending Code..." : "Create Account & Get Code"}</button>
            </form>
          ) : step === "otp" ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <input type="text" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="000000" required className="w-full px-4 py-3 text-3xl text-center font-bold bg-slate-50 border border-slate-200 rounded-xl" />
              <button disabled={loading || otp.length !== 6} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl text-lg tracking-widest">{loading ? "Verifying..." : "Verify Code"}</button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-sm text-slate-500 underline">Change email</button>
            </form>
          ) : (
            <form onSubmit={handleSetPassword} className="space-y-4">
              <h2 className="text-center font-semibold">Set Password</h2>
              <input type="password" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New Password" required className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none" />
              <button disabled={loading || newPassword.length < 6} className="w-full py-3 bg-green-600 text-white font-bold rounded-xl">{loading ? "Saving..." : "Set & Finish"}</button>
            </form>
          )
        )}
      </div>
    </div>
  );
}
