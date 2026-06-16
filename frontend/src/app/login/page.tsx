"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, EyeOff, GraduationCap, ChevronRight } from "lucide-react";
import { Shader, Swirl, ChromaFlow, FlutedGlass, FilmGrain } from "shaders/react";

export default function Login() {
  const [authMode, setAuthMode] = useState<"login" | "register" | "otp">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [otp, setOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Read visual query param state client-side
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("mode") === "register") {
        setAuthMode("register");
      }
    }
  }, []);

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

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

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

      setAuthMode("otp"); // Move to OTP step
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
    <div className="h-screen w-full relative flex bg-transparent font-sans selection:bg-orange-100 overflow-hidden">
      {/* Full-Screen Shader Background - absolute inset-0 so it matches the viewport precisely */}
      <div className="absolute inset-0 z-0 pointer-events-auto cursor-pointer">
        <Shader className="w-full h-full" style={{ width: "100%", height: "100%" }}>
          <FilmGrain strength={0.05}>
            <FlutedGlass aberration={0.61} angle={31} frequency={8} highlight={0.12} highlightSoftness={0} lightAngle={-90} refraction={4} shape="rounded" softness={1} speed={0.15}>
              <ChromaFlow baseColor="#ffffff" downColor="#F26522" leftColor="#F26522" rightColor="#F26522" upColor="#F26522" momentum={13} radius={3.5}>
                <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
              </ChromaFlow>
            </FlutedGlass>
          </FilmGrain>
        </Shader>
      </div>

      {/* Main Content Container - pointer-events-none so click-throughs hit the shader */}
      <div className="relative z-10 w-full h-full flex flex-col lg:flex-row pointer-events-none">
        {/* Left Pane - Visible on Desktop */}
        <div className="hidden lg:flex lg:w-[40%] xl:w-[45%] flex-col justify-between p-8 lg:p-10 xl:p-14 h-full">
          {/* Top Section - Logo */}
          <div className="flex items-center gap-3 select-none pointer-events-auto">
            <div className="w-10 h-10 bg-[#F26522] rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <GraduationCap className="text-white" size={22} />
            </div>
            <span 
              className="font-extrabold text-[20px] text-gray-900 tracking-tight"
              style={{ textShadow: '0 0 10px rgba(242, 101, 34, 0.4), 0 0 20px rgba(242, 101, 34, 0.15)' }}
            >
              Educator Hub
            </span>
          </div>

          {/* Center Section - Text & Features */}
          <div className="max-w-xl my-auto select-none pointer-events-auto">
            <span 
              className="text-[12px] text-[#F26522] tracking-wider mb-3 uppercase font-black block"
              style={{ textShadow: '0 0 8px rgba(242, 101, 34, 0.5)' }}
            >
              Student-Tutor Marketplace
            </span>
            <h1 
              className="text-4xl font-black text-gray-900 leading-[1.2] tracking-tight mb-8"
              style={{ textShadow: '0 0 15px rgba(242, 101, 34, 0.25), 0 0 30px rgba(242, 101, 34, 0.1)' }}
            >
              Join Thousands of Students & Tutors that Trust <span className="text-[#F26522]" style={{ textShadow: '0 0 12px rgba(242, 101, 34, 0.6), 0 0 25px rgba(242, 101, 34, 0.3)' }}>Educator Hub</span> to Supercharge their Learning
            </h1>
            
            {/* Glowy feature list inspired by the Razorpay aesthetic */}
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-[15px] font-bold text-gray-800">
              <span className="flex items-center gap-2">
                <span className="text-[#F26522] text-[18px] font-black" style={{ textShadow: '0 0 10px rgba(242, 101, 34, 0.8), 0 0 20px rgba(242, 101, 34, 0.4)' }}>—</span>
                <span style={{ textShadow: '0 0 8px rgba(242, 101, 34, 0.15)' }}>100+ Subjects</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#F26522] text-[18px] font-black" style={{ textShadow: '0 0 10px rgba(242, 101, 34, 0.8), 0 0 20px rgba(242, 101, 34, 0.4)' }}>+</span>
                <span style={{ textShadow: '0 0 8px rgba(242, 101, 34, 0.15)' }}>Live 1-on-1 Chat</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-[#F26522] text-[18px] font-black" style={{ textShadow: '0 0 10px rgba(242, 101, 34, 0.8), 0 0 20px rgba(242, 101, 34, 0.4)' }}>+</span>
                <span style={{ textShadow: '0 0 8px rgba(242, 101, 34, 0.15)' }}>Secure Payments</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Pane - Container that handles scrolling */}
        <div className="w-full lg:w-[60%] xl:w-[55%] h-full overflow-y-auto pointer-events-auto">
          {/* Centering Wrapper with adaptive padding */}
          <div className="min-h-full w-full flex items-center justify-center p-4 sm:p-6 lg:p-10 xl:p-12">
            <div className="max-w-[440px] w-full bg-white/45 backdrop-blur-2xl border border-white/40 shadow-2xl rounded-3xl p-6 sm:p-8 relative">
              <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-gray-950 transition font-bold text-xs uppercase tracking-wider">
                <ArrowLeft size={14} /> Back to Home
              </Link>

              {/* Logo Icon */}
              <div className="w-10 h-10 bg-[#F26522] rounded-xl flex items-center justify-center text-white mb-3 mt-4 shadow-lg shadow-orange-500/20">
                <GraduationCap size={20} />
              </div>

              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">
                {authMode === "login" ? "Welcome to" : authMode === "register" ? "Join" : "Verify"} <span className="text-gray-700 font-extrabold">Educator Hub</span>
              </p>

              <h2 className="text-[24px] font-black text-gray-900 leading-tight mb-4" style={{ textShadow: '0 0 12px rgba(242, 101, 34, 0.1)' }}>
                {authMode === "login" ? "Get started with your email and password" : authMode === "register" ? "Create your free account" : "Verify your email"}
              </h2>

              {error && (
                <div className="mb-4 text-red-600 bg-red-50/80 backdrop-blur-md border border-red-100 p-3.5 rounded-xl text-xs font-bold leading-relaxed">
                  {error}
                </div>
              )}

              {/* CONDITIONAL FORMS */}
              {authMode === "login" && (
                <form onSubmit={handleLogin} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-white/60 border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all placeholder-gray-400" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white/60 border border-[#F26522]/30 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all placeholder-gray-400 pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#F26522] focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white py-3.5 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2 cursor-pointer"
                  >
                    {isLoading ? "Authenticating..." : "Continue"}
                  </button>
                </form>
              )}

              {authMode === "register" && (
                <form onSubmit={handleRegister} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input 
                      type="text" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      required 
                      placeholder="John Doe"
                      className="w-full px-4 py-3 bg-white/60 border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all placeholder-gray-400" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input 
                      type="email" 
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      required 
                      placeholder="you@example.com"
                      className="w-full px-4 py-3 bg-white/60 border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all placeholder-gray-400" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        required 
                        placeholder="••••••••"
                        className="w-full px-4 py-3 bg-white/60 border border-[#F26522]/30 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all placeholder-gray-400 pr-10" 
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#F26522] focus:outline-none"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">I am a...</label>
                    <select 
                      value={role} 
                      onChange={(e) => setRole(e.target.value)} 
                      className="w-full px-4 py-3 bg-white/60 border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none text-[13px] font-semibold text-gray-850 transition-all appearance-none cursor-pointer"
                    >
                      <option value="STUDENT">Student</option>
                      <option value="TUTOR">Tutor</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white py-3.5 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-2 cursor-pointer"
                  >
                    {isLoading ? "Creating Account..." : "Register"}
                  </button>
                </form>
              )}

              {authMode === "otp" && (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <p className="text-[12px] text-gray-500 font-semibold text-center mb-4 leading-relaxed">
                    We've sent a 6-digit OTP to <b className="text-gray-800">{email}</b>. Please enter it below.
                  </p>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">One-Time Password</label>
                    <input 
                      type="text" 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      required
                      maxLength={6}
                      placeholder="123456"
                      className="w-full px-4 py-3 text-center tracking-[0.2em] text-lg font-black bg-white/60 border border-gray-200/80 rounded-xl focus:bg-white focus:border-[#F26522] focus:ring-2 focus:ring-orange-100 outline-none transition-all placeholder-gray-400" 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isLoading || otp.length < 6}
                    className="w-full bg-[#F26522] hover:bg-[#e05a1a] text-white py-3.5 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 cursor-pointer"
                  >
                    {isLoading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setAuthMode("register"); setError(""); }}
                    className="w-full text-center text-xs text-orange-600 hover:underline font-bold mt-4 cursor-pointer"
                  >
                    Change email / Back to register
                  </button>
                </form>
              )}

              {authMode !== "otp" && (
                <p className="text-[11px] text-gray-400 font-medium text-center mt-6 leading-relaxed">
                  By continuing you agree to our <Link href="/privacy-policy" className="text-orange-600 hover:underline">privacy policy</Link> and <Link href="/terms" className="text-orange-600 hover:underline">terms of use</Link>
                </p>
              )}

              {/* SWITCH MODE FOOTERS */}
              {authMode === "login" && (
                <div className="mt-5 bg-white/50 border border-white/40 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">New to Educator Hub?</p>
                    <p className="text-[11px] text-gray-700 font-bold mt-0.5">Create a free student or tutor account</p>
                  </div>
                  <button 
                    onClick={() => { setAuthMode("register"); setError(""); }} 
                    className="text-[#F26522] hover:text-[#e05a1a] text-[11px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    Register <ChevronRight size={12} />
                  </button>
                </div>
              )}

              {authMode === "register" && (
                <div className="mt-5 bg-white/50 border border-white/40 p-3.5 rounded-xl flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-[9px] text-gray-400 font-extrabold uppercase tracking-wider">Already have an account?</p>
                    <p className="text-[11px] text-gray-700 font-bold mt-0.5">Log in to your account</p>
                  </div>
                  <button 
                    onClick={() => { setAuthMode("login"); setError(""); }} 
                    className="text-[#F26522] hover:text-[#e05a1a] text-[11px] font-bold flex items-center gap-0.5 transition-colors cursor-pointer"
                  >
                    Log in <ChevronRight size={12} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
