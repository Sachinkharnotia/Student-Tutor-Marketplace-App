import Link from "next/link";
import { ArrowLeft, Compass, Home, LogIn } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#fafbfc] text-gray-900 flex items-center justify-center px-6 py-12 font-sans relative overflow-hidden">
      {/* Dynamic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(242,101,34,0.06),transparent_40%),radial-gradient(circle_at_80%_80%,rgba(99,102,241,0.04),transparent_40%)] pointer-events-none" />
      
      {/* Decorative Grid Lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.01)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      <section className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center relative z-10 animate-in fade-in duration-700">
        <div className="space-y-6">
          {/* Breadcrumb / Top Link */}
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#F26522] transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </Link>

          {/* Large Status Code */}
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#F26522] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100/60 inline-block">
              Error 404
            </span>
            <h1 className="text-[clamp(2.5rem,6vw,4.8rem)] font-black leading-[1.05] tracking-tight text-gray-950">
              Page Not Found
            </h1>
          </div>

          {/* Friendly Context Message */}
          <p className="max-w-xl text-[15px] sm:text-[17px] leading-relaxed text-gray-500 font-medium">
            The page you are looking for doesn't exist, has been moved, or is temporarily unavailable. Let's get you back on track to finding the best educators and managing your sessions with Educator Hub.
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-col sm:flex-row gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#d8561b] text-white px-6 py-3.5 rounded-2xl text-[13px] font-extrabold transition shadow-lg shadow-orange-500/15 hover:shadow-orange-500/25 active:scale-95 duration-200"
            >
              <Home size={16} />
              Go Home
            </Link>
            <Link 
              href="/login" 
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-orange-200 hover:bg-orange-50/20 text-gray-700 px-6 py-3.5 rounded-2xl text-[13px] font-extrabold transition shadow-sm active:scale-95 duration-200"
            >
              <LogIn size={16} className="text-gray-400" />
              Sign in to Account
            </Link>
          </div>
        </div>

        {/* Visual Premium Glassmorphism Card */}
        <div className="relative min-h-[300px] md:min-h-[380px] rounded-[32px] border border-white/80 bg-white/40 backdrop-blur-xl shadow-xl shadow-orange-950/5 overflow-hidden flex items-center justify-center group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-white/10 pointer-events-none" />
          
          {/* Pulsing visual core */}
          <div className="relative w-44 h-44 rounded-full bg-white flex items-center justify-center shadow-2xl shadow-orange-500/10 border border-orange-50/50 group-hover:scale-105 transition-transform duration-500">
            <div className="absolute inset-0 rounded-full bg-[#F26522]/5 animate-ping opacity-60 duration-1000" />
            <Compass size={88} className="text-[#F26522] animate-pulse" strokeWidth={1.2} />
          </div>

          {/* Decorative Labels */}
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-white/70 border border-white px-5 py-3.5 backdrop-blur-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Status Check</span>
            <span className="text-xs font-black bg-[#F26522] text-white px-2 py-0.5 rounded-md">404</span>
          </div>
        </div>
      </section>
    </main>
  );
}
