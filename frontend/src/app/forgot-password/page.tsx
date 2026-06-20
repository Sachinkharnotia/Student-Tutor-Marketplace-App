"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to send reset OTP");
      setSuccess(data.message || "OTP sent successfully.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to send reset OTP");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-10 font-sans">
      <section className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8">
        <Link href="/login" className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#F26522] transition mb-7">
          <ArrowLeft size={14} />
          Back to Login
        </Link>

        <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-[#F26522] mb-4">
          <Mail size={20} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#F26522] mb-1">Password Recovery</p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Forgot Password</h1>
        <p className="text-[13px] text-gray-500 font-medium leading-6 mt-2 mb-6">
          Enter your registered email and we will send a one-time password to reset your account.
        </p>

        {error && <div className="mb-4 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-[12px] font-bold text-red-600">{error}</div>}
        {success && (
          <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-[12px] font-bold text-emerald-700 flex items-start gap-2">
            <CheckCircle size={16} className="shrink-0 mt-0.5" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-900 transition"
            />
          </div>
          <button disabled={isLoading} className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white py-3.5 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50">
            {isLoading ? "Sending OTP..." : "Send OTP"}
          </button>
        </form>

        {success && (
          <Link href={`/reset-password?email=${encodeURIComponent(email)}`} className="mt-4 flex items-center justify-center w-full bg-gray-900 hover:bg-black text-white py-3.5 rounded-xl text-[13px] font-bold transition">
            Continue to Reset
          </Link>
        )}
      </section>
    </main>
  );
}
