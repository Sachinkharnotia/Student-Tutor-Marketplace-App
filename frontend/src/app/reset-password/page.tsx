"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, KeyRound } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return new URLSearchParams(window.location.search).get("email") || "";
  });
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to reset password");
      setSuccess(data.message || "Password reset successfully.");
      setTimeout(() => router.push("/login"), 1400);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f9fa] flex items-center justify-center px-4 py-10 font-sans">
      <section className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl p-6 sm:p-8">
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-400 hover:text-[#F26522] transition mb-7">
          <ArrowLeft size={14} />
          Request OTP
        </Link>

        <div className="w-11 h-11 bg-orange-50 border border-orange-100 rounded-xl flex items-center justify-center text-[#F26522] mb-4">
          <KeyRound size={20} />
        </div>
        <p className="text-[11px] font-black uppercase tracking-wider text-[#F26522] mb-1">Secure Reset</p>
        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Reset Password</h1>
        <p className="text-[13px] text-gray-500 font-medium leading-6 mt-2 mb-6">
          Enter the OTP from your email and choose a new password for your account.
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
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-900 transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">One-Time Password</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
              maxLength={6}
              required
              placeholder="123456"
              className="w-full px-4 py-3 text-center tracking-[0.2em] text-lg font-black bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none transition"
            />
          </div>
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-900 transition"
            />
          </div>
          <button disabled={isLoading || otp.length < 6} className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white py-3.5 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50">
            {isLoading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </section>
    </main>
  );
}
