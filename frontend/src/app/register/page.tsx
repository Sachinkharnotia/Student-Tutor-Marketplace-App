"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function Register() {
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      setStep(2); // Move to OTP step
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "OTP Verification failed");
      }

      // Store token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      alert("Registration & Verification successful!");
      
      if (data.user.role === 'STUDENT') {
        router.push('/dashboard/student');
      } else if (data.user.role === 'TUTOR') {
        router.push('/dashboard/tutor');
      } else {
        router.push('/dashboard/admin');
      }

    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative">
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-900 transition font-medium text-sm">
        <ArrowLeft size={16} /> Back to Home
      </Link>
      
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
          {step === 1 ? "Create Account" : "Verify Email"}
        </h2>
        {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">I am a...</label>
              <select 
                value={role} 
                onChange={(e) => setRole(e.target.value)} 
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="STUDENT">Student</option>
                <option value="TUTOR">Tutor</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#F26522] text-white p-2.5 rounded-xl font-bold hover:bg-[#e05a1a] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? "Creating Account..." : "Register"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600 text-center mb-4">
              We've sent a 6-digit OTP to <b>{email}</b>. Please enter it below.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700">One-Time Password</label>
              <input 
                type="text" 
                value={otp} 
                onChange={(e) => setOtp(e.target.value)} 
                required
                maxLength={6}
                placeholder="123456"
                className="mt-1 block w-full p-3 text-center tracking-widest text-xl border border-gray-300 rounded-md shadow-sm" 
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading || otp.length < 6}
              className="w-full bg-[#F26522] text-white p-2.5 rounded-xl font-bold hover:bg-[#e05a1a] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
            >
              {isLoading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 1 && (
          <p className="mt-4 text-center text-sm text-gray-600">
            Already have an account? <Link href="/login" className="text-[#F26522] font-bold hover:underline">Log in here</Link>
          </p>
        )}

      </div>
    </div>
  );
}
