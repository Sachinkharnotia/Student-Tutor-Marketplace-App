import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f8f9fa] text-gray-900 flex items-center justify-center px-5 py-10 font-sans">
      <section className="w-full max-w-5xl grid lg:grid-cols-[1fr_0.8fr] gap-10 items-center">
        <div>
          <Link href="/" className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-gray-500 hover:text-[#F26522] transition-colors mb-8">
            <ArrowLeft size={15} />
            Back to Home
          </Link>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#F26522] mb-3">404 Error</p>
          <h1 className="text-[clamp(2.4rem,8vw,5.5rem)] font-black leading-[0.98] tracking-tight">
            Page Not Found
          </h1>
          <p className="mt-5 max-w-xl text-[15px] sm:text-[17px] leading-7 text-gray-600 font-medium">
            The page you are looking for is unavailable or may have moved. Return home to continue finding tutors, managing sessions, or learning with Educator Hub.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/" className="inline-flex items-center justify-center gap-2 bg-[#F26522] hover:bg-[#e05a1a] text-white px-5 py-3 rounded-xl text-[13px] font-bold transition shadow-lg shadow-orange-500/20">
              <Home size={16} />
              Back to Home
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 hover:border-orange-200 text-gray-900 px-5 py-3 rounded-xl text-[13px] font-bold transition shadow-sm">
              Sign in
            </Link>
          </div>
        </div>

        <div className="relative min-h-[280px] rounded-[28px] border border-gray-100 bg-white shadow-sm overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(242,101,34,0.14),transparent_34%),radial-gradient(circle_at_80%_75%,rgba(17,24,39,0.08),transparent_32%)]" />
          <div className="relative w-40 h-40 rounded-full bg-gray-950 flex items-center justify-center shadow-2xl shadow-orange-500/10">
            <Compass size={78} className="text-[#F26522]" strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3">
            <span className="text-[12px] font-bold text-gray-500">Route missing</span>
            <span className="text-[12px] font-black text-gray-900">404</span>
          </div>
        </div>
      </section>
    </main>
  );
}
