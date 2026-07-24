"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Step = "login" | "otp";

export default function AuthPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("login");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSendOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (!email.endsWith("@applywizz.ai")) {
      setError("Only @applywizz.ai emails are allowed.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setSuccess("We've sent a 6-digit code to your email.");
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      // Successful login, redirect to dashboard
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="ApplyWizz" className="w-16 h-16 mx-auto object-contain rounded-xl" />
          <h1 className="text-2xl font-bold text-slate-900 mt-4">ApplyWizz</h1>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">{error}</div>}
        {success && <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-100 text-green-600 text-sm">{success}</div>}

        {step === "login" ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="name@applywizz.ai" 
              required 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition" 
            />
            <button 
              disabled={loading} 
              className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <input 
              type="text" 
              value={otp} 
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\\D/g, ""))} 
              placeholder="000000" 
              required 
              className="w-full px-4 py-3 text-center text-3xl tracking-[1em] font-bold bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-slate-400 transition" 
            />
            <button 
              disabled={loading || otp.length !== 6} 
              className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button 
              type="button" 
              onClick={() => { setStep("login"); setSuccess(""); setError(""); setOtp(""); }} 
              className="w-full text-sm text-slate-500 underline"
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
