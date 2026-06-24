"use client";

import React from 'react';
import Link from 'next/link';
import { Search, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#fcfcfc] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Ornaments */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-orange-400/20 to-orange-100/0 rounded-full blur-[80px] animate-pulse"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-tl from-indigo-500/10 to-indigo-100/0 rounded-full blur-[100px] animate-pulse delay-700"></div>

      <div className="max-w-2xl w-full bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl p-10 md:p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative z-10 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center text-center">
        
        {/* Floating 404 Illustration */}
        <div className="relative mb-10 flex items-center justify-center">
          <div className="text-[150px] md:text-[200px] font-black leading-none bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-400 select-none">
            404
          </div>
          <div className="absolute flex items-center justify-center animate-bounce duration-2000">
            <div className="w-24 h-24 md:w-32 md:h-32 bg-[#F26522] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(242,101,34,0.4)] border-[8px] border-white backdrop-blur-md">
              <Search className="text-white w-10 h-10 md:w-14 md:h-14 stroke-[2.5]" />
            </div>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">
          Page Not Found
        </h1>
        <p className="text-[15px] text-gray-500 max-w-md mx-auto mb-10 leading-relaxed">
          Oops! It seems you've wandered off the map. The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <button 
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-gray-50 text-gray-700 rounded-2xl font-bold text-[14px] hover:bg-gray-100 hover:text-gray-900 transition-all border border-gray-200/60 shadow-sm"
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <Link 
            href="/"
            className="flex items-center justify-center gap-2 px-8 py-4 bg-[#F26522] text-white rounded-2xl font-bold text-[14px] hover:bg-[#e05a1a] transition-all shadow-[0_8px_20px_rgba(242,101,34,0.25)] hover:shadow-[0_12px_25px_rgba(242,101,34,0.35)] hover:-translate-y-0.5"
          >
            <Home size={18} />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
