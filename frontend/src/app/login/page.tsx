"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("http://localhost:4000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store token and user data
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirect based on role
      if (data.user.role === 'STUDENT') {
        router.push('/dashboard/student');
      } else if (data.user.role === 'TUTOR') {
        router.push('/dashboard/tutor');
      } else if (data.user.role === 'ADMIN') {
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
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">Welcome Back</h2>
        {error && <div className="mb-4 text-red-600 bg-red-100 p-3 rounded">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
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
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-[#F26522] text-white p-2.5 rounded-xl font-bold hover:bg-[#e05a1a] transition shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
          >
            {isLoading ? "Authenticating..." : "Log In"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-gray-600">
          Don't have an account? <Link href="/register" className="text-[#F26522] font-bold hover:underline">Register here</Link>
        </p>
      </div>
    </div>
  );
}
