"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Menu, X, Link as LinkIcon } from "lucide-react";
import {
  Shader,
  Swirl,
  ChromaFlow,
  FlutedGlass,
  FilmGrain,
} from "shaders/react";

// --- Custom SVG Component for Partner Badge ---
const PartnerBadgeSVG = () => (
  <svg
    className="w-5 h-5 sm:w-6 sm:h-6 fill-current text-[#E8704E]"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 100 100"
  >
    <path d="m19.6 66.5 19.7-11 .3-1-.3-.5h-1l-3.3-.2-11.2-.3L14 53l-9.5-.5-2.4-.5L0 49l.2-1.5 2-1.3 2.9.2 6.3.5 9.5.6 6.9.4L38 49.1h1.6l.2-.7-.5-.4-.4-.4L29 41l-10.6-7-5.6-4.1-3-2-1.5-2-.6-4.2 2.7-3 3.7.3.9.2 3.7 2.9 8 6.1L37 36l1.5 1.2.6-.4.1-.3-.7-1.1L33 25l-6-10.4-2.7-4.3-.7-2.6c-.3-1-.4-2-.4-3l3-4.2L28 0l4.2.6L33.8 2l2.6 6 4.1 9.3L47 29.9l2 3.8 1 3.4.3 1h.7v-.5l.5-7.2 1-8.7 1-11.2.3-3.2 1.6-3.8 3-2L61 2.6l2 2.9-.3 1.8-1.1 7.7L59 27.1l-1.5 8.2h.9l1-1.1 4.1-5.4 6.9-8.6 3-3.5L77 13l2.3-1.8h4.3l3.1 4.7-1.4 4.9-4.4 5.6-3.7 4.7-5.3 7.1-3.2 5.7.3.4h.7l12-2.6 6.4-1.1 7.6-1.3 3.5 1.6.4 1.6-1.4 3.4-8.2 2-9.6 2-14.3 3.3-.2.1.2.3 6.4.6 2.8.2h6.8l12.6 1 3.3 2 1.9 2.7-.3 2-5.1 2.6-6.8-1.6-16-3.8-5.4-1.3h-.8v.4l4.6 4.5 8.3 7.5L89 80.1l.5 2.4-1.3 2-1.4-.2-9.2-7-3.6-3-8-6.8h-.5v.7l1.8 2.7 9.8 14.7.5 4.5-.7 1.4-2.6 1-2.7-.6-5.8-8-6-9-4.7-8.2-.5.4-2.9 30.2-1.3 1.5-3 1.2-2.5-2-1.4-3 1.4-6.2 1.6-8 1.3-6.4 1.2-7.9.7-2.6v-.2H49L43 72l-9 12.3-7.2 7.6-1.7.7-3-1.5.3-2.8L24 86l10-12.8 6-7.9 4-4.6-.1-.5h-.3L17.2 77.4l-4.7.6-2-2 .2-3 1-1 8-5.5Z" />
  </svg>
);

// --- Reusable Button with Text Roll ---
const TextRollBtn = ({
  text,
  href,
  orange = false,
}: {
  text: string;
  href: string;
  orange?: boolean;
}) => {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-3 rounded-full pl-5 pr-2 py-2 transition-colors duration-500 ${orange ? "bg-[#F26522] hover:bg-[#e05a1a]" : "bg-gray-900"}`}
    >
      <div className="overflow-hidden h-[20px] relative">
        <div className="flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-translate-y-1/2">
          <span className="h-[20px] flex items-center text-white text-[13px] font-medium leading-none">
            {text}
          </span>
          <span className="h-[20px] flex items-center text-white text-[13px] font-medium leading-none">
            {text}
          </span>
        </div>
      </div>
      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.25,0.1,0.25,1)] group-hover:-rotate-45">
        <ArrowRight
          className={`w-3 h-3 sm:w-4 sm:h-4 ${orange ? "text-[#F26522]" : "text-gray-900"}`}
          strokeWidth={3}
        />
      </div>
    </Link>
  );
};

export default function App() {
  const [time, setTime] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // India Clock Effect
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const indiaTime = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
      });
      setTime(`${indiaTime} in India`);
    };
    updateTime();
    const int = setInterval(updateTime, 1000);
    return () => clearInterval(int);
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 font-sans selection:bg-gray-900 selection:text-white">
      {/* SECTION 1: HERO */}
      <section className="relative h-[100dvh] w-full flex flex-col bg-[#EFEFEF] overflow-hidden">
        {/* Shaders Background */}
        <div className="absolute inset-0 z-0 pointer-events-auto cursor-pointer">
          <Shader
            className="w-full h-full"
            style={{ width: "100%", height: "100%" }}
          >
            <FilmGrain strength={0.05}>
              <FlutedGlass
                aberration={0.61}
                angle={31}
                frequency={8}
                highlight={0.12}
                highlightSoftness={0}
                lightAngle={-90}
                refraction={4}
                shape="rounded"
                softness={1}
                speed={0.15}
              >
                <ChromaFlow
                  baseColor="#ffffff"
                  downColor="#ff5f03"
                  leftColor="#ff5f03"
                  rightColor="#ff5f03"
                  upColor="#ff5f03"
                  momentum={13}
                  radius={3.5}
                >
                  <Swirl colorA="#ffffff" colorB="#f0f0f0" detail={1.7} />
                </ChromaFlow>
              </FlutedGlass>
            </FilmGrain>
          </Shader>
        </div>

        {/* Navigation */}
        <nav className="relative z-30 max-w-[1440px] w-full mx-auto p-2 sm:p-3 pt-4 sm:pt-6 pointer-events-none">
          <div className="bg-white rounded-full p-[5px] flex items-center justify-between shadow-sm pointer-events-auto">
            {/* Nav Left */}
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 rounded-full flex items-center justify-center shrink-0"
              >
                <span className="text-white text-[10px] sm:text-[11px] font-bold tracking-tight">
                  ST
                </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link
                  href="/register"
                  className="text-[14px] text-gray-900 hover:text-gray-500 transition-colors duration-300"
                >
                  Browse Tutors
                </Link>
                <Link
                  href="#how-it-works"
                  className="text-[14px] text-gray-900 hover:text-gray-500 transition-colors duration-300"
                >
                  How it Works
                </Link>
                <Link
                  href="/register"
                  className="text-[14px] text-gray-900 hover:text-gray-500 transition-colors duration-300"
                >
                  Become a Tutor
                </Link>
                <Link
                  href="/login"
                  className="text-[14px] text-gray-900 hover:text-gray-500 transition-colors duration-300"
                >
                  Support
                </Link>
              </div>
            </div>

            {/* Nav Right (Desktop) */}
            <div className="hidden md:flex items-center gap-5">
              <span className="text-[13px] text-gray-600 hidden lg:block">
                Master any subject with top tutors
              </span>
              <div className="flex items-center gap-1.5 text-gray-600">
                <Clock className="w-[14px] h-[14px]" />
                <span className="text-[13px]">{time}</span>
              </div>
              <TextRollBtn text="Login" href="/login" />
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden w-9 h-9 sm:w-10 sm:h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shrink-0 z-50 mr-1"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </nav>

        {/* Hero Content (Pushed to bottom) */}
        <div className="relative z-20 flex-1 flex flex-col justify-end max-w-[1440px] w-full mx-auto px-5 sm:px-8 lg:px-12 pb-14 sm:pb-16 lg:pb-20 pointer-events-none">
          <span
            className="text-[13px] sm:text-[14px] text-[#F26522] tracking-wide mb-5 sm:mb-8 uppercase font-extrabold select-none pointer-events-auto"
            style={{ textShadow: "0 0 10px rgba(242, 101, 34, 0.25)" }}
          >
            Student-Tutor Marketplace
          </span>

          <h1
            className="text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-black leading-[1.08] tracking-[-0.03em] text-gray-900 max-w-[1000px] select-none pointer-events-auto"
            style={{
              textShadow:
                "0 0 20px rgba(242, 101, 34, 0.2), 0 0 40px rgba(242, 101, 34, 0.1)",
            }}
          >
            Master any subject
            <br className="hidden sm:block" />
            with{" "}
            <span
              className="text-[#F26522]"
              style={{
                textShadow:
                  "0 0 15px rgba(242, 101, 34, 0.6), 0 0 30px rgba(242, 101, 34, 0.3)",
              }}
            >
              world-class tutors
            </span>
            <br className="hidden sm:block" />
            ready to elevate your learning.
          </h1>

          <div className="mt-8 sm:mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 pointer-events-auto">
            <TextRollBtn text="Find a Tutor" href="/register" orange={true} />

            <div className="bg-white rounded-[4px] px-2 py-1.5 flex items-center gap-2.5 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-shadow duration-300">
              <PartnerBadgeSVG />
              <span className="text-[13px] sm:text-[14px] font-medium text-gray-900">
                Verified Tutors Only
              </span>
              <span className="text-[10px] sm:text-[11px] bg-gray-900 text-white px-1.5 sm:px-2 py-0.5 rounded leading-none uppercase">
                Trusted
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE MENU OVERLAY */}
      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-500 md:hidden ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={`absolute bottom-3 left-3 right-3 bg-white rounded-2xl p-6 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col gap-6 ${mobileMenuOpen ? "translate-y-0" : "translate-y-[120%]"}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 text-gray-500">
            <Clock size={16} />
            <span className="text-[14px]">{time}</span>
          </div>
          <div className="flex flex-col gap-4">
            {["Register as Student", "Register as Tutor", "Login"].map(
              (link) => (
                <Link
                  key={link}
                  href={`/${link.toLowerCase().includes("login") ? "login" : "register"}`}
                  className="text-[28px] font-medium text-gray-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link}
                </Link>
              ),
            )}
          </div>
          <TextRollBtn text="Find a Tutor" href="/register" orange={true} />
        </div>
      </div>

      {/* SECTION 2: ABOUT / HOW IT WORKS */}
      <section
        id="how-it-works"
        className="bg-white pt-16 sm:pt-20 lg:pt-32 pb-12 sm:pb-16 lg:pb-24 overflow-hidden relative z-20"
      >
        <div className="max-w-[1440px] mx-auto">
          {/* Badge Row */}
          <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center shrink-0">
              1
            </div>
            <div className="text-[12px] sm:text-[13px] font-medium border border-gray-200 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-gray-900">
              How the Marketplace Works
            </div>
          </div>

          {/* Heading */}
          <h2 className="px-5 sm:px-8 lg:px-12 text-[clamp(1.5rem,4vw,3.2rem)] font-medium leading-[1.12] tracking-[-0.02em] text-gray-900 mb-12 sm:mb-16 lg:mb-28 max-w-[1000px]">
            Seamlessly connect with vetted educators,{" "}
            <br className="hidden md:block" /> delivering results in digital
            classrooms and beyond.
          </h2>

          {/* Content Area */}
          <div className="px-5 sm:px-8 lg:px-12">
            {/* Mobile/Tablet Layout */}
            <div className="flex flex-col gap-8 lg:hidden">
              <div className="flex flex-col items-start gap-6">
                <p className="text-[15px] sm:text-[17px] leading-[1.6] font-medium text-gray-900">
                  Through strict KYC verification, secure Razorpay payments, and
                  real-time chat, we help students realize their full potential
                  safely.
                </p>
                <TextRollBtn
                  text="Start Learning"
                  href="/register"
                  orange={true}
                />
              </div>
              <div className="flex flex-col sm:flex-row gap-4 sm:gap-5">
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85"
                  alt="Student studying"
                  className="w-full sm:w-[45%] aspect-[438/346] rounded-xl sm:rounded-2xl object-cover"
                />
                <img
                  src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85"
                  alt="Tutor teaching"
                  className="w-full sm:w-[55%] aspect-[900/600] rounded-xl sm:rounded-2xl object-cover"
                />
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden lg:grid grid-cols-[26%_1fr_48%] items-end gap-6 xl:gap-8">
              <img
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090123_74be96d4-9c1b-40cf-932a-96f4f4babed3.png&w=1280&q=85"
                alt="Student studying"
                className="w-full aspect-[438/346] rounded-2xl object-cover self-end"
              />
              <div className="flex flex-col items-start gap-8 self-start justify-end h-full max-w-[320px] pb-8">
                <p className="text-[16px] xl:text-[18px] leading-[1.65] text-gray-900 font-medium">
                  Through strict KYC verification, <br /> secure Razorpay
                  payments, <br /> and real-time chat, we help <br /> students
                  realize their <br /> full educational potential.
                </p>
                <TextRollBtn
                  text="Join as a Tutor"
                  href="/register"
                  orange={true}
                />
              </div>
              <img
                src="https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260516_090133_c157d30b-a99a-4477-bec1-a446149ec3f2.png&w=1280&q=85"
                alt="Tutor teaching"
                className="w-full aspect-[3/2] rounded-2xl object-cover self-end"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: CASE STUDIES / TOP TUTORS */}
      <section className="bg-[#F5F5F5] pt-16 sm:pt-20 lg:pt-28 pb-16 sm:pb-20 lg:pb-28">
        <div className="max-w-[1440px] mx-auto">
          {/* Badge Row */}
          <div className="px-5 sm:px-8 lg:px-12 flex items-center gap-3 mb-6 sm:mb-8">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gray-900 text-white text-[11px] sm:text-[12px] font-semibold flex items-center justify-center shrink-0">
              2
            </div>
            <div className="text-[12px] sm:text-[13px] font-medium border border-gray-300 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 text-gray-900">
              Success Stories
            </div>
          </div>

          <h2 className="px-5 sm:px-8 lg:px-12 text-[clamp(1.75rem,7vw,4.2rem)] sm:text-[clamp(2.5rem,5vw,4.2rem)] font-medium leading-[1.08] tracking-[-0.03em] text-gray-900 mb-10 sm:mb-14 lg:mb-16">
            Featured Tutors
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 lg:gap-7 px-5 sm:px-8 lg:px-12">
            {/* Card 1 */}
            <div className="flex flex-col">
              <div className="relative aspect-[329/246] rounded-2xl overflow-hidden bg-[#1a1d2e] group cursor-pointer border border-gray-100 shadow-sm">
                <img
                  src="/sarah_jenkins_avatar.png"
                  alt="Prof. Sarah Jenkins"
                  className="w-full h-full object-cover"
                />

                {/* Expanding Hover Button */}
                <Link
                  href="/register"
                  className="absolute bottom-4 left-4 h-9 w-9 bg-white rounded-full flex items-center overflow-hidden transition-all duration-300 ease-in-out group-hover:w-[148px]"
                >
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center z-10 bg-white rounded-full">
                    <LinkIcon
                      className="w-3.5 h-3.5 text-gray-900 -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900 whitespace-nowrap opacity-0 transition-opacity duration-300 delay-100 ease-in-out group-hover:opacity-100 ml-1">
                    Book Session
                  </span>
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                  Prof. Sarah Jenkins
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 mt-1 leading-relaxed">
                  Winner of Tutor of the Year 2025 - Interactive Advanced
                  Mathematics driving record exam scores.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-[#6b6b6b] group cursor-pointer border border-gray-100 shadow-sm">
                <img
                  src="/david_chen_avatar.png"
                  alt="Dr. David Chen"
                  className="w-full h-full object-cover"
                />

                {/* Expanding Hover Button (Dark) */}
                <Link
                  href="/register"
                  className="absolute bottom-4 left-4 h-9 w-9 bg-gray-900 rounded-full flex items-center overflow-hidden transition-all duration-300 ease-in-out group-hover:w-[168px]"
                >
                  <div className="w-9 h-9 shrink-0 flex items-center justify-center z-10 bg-gray-900 rounded-full">
                    <ArrowRight
                      className="w-3.5 h-3.5 text-white -rotate-45 transition-transform duration-300 ease-in-out group-hover:rotate-0"
                      strokeWidth={2.5}
                    />
                  </div>
                  <span className="text-[13px] font-medium text-white whitespace-nowrap opacity-0 transition-opacity duration-300 delay-100 ease-in-out group-hover:opacity-100 ml-1">
                    View Profile
                  </span>
                </Link>
              </div>
              <div className="mt-4">
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-gray-900">
                  Dr. David Chen
                </h3>
                <p className="text-[13px] sm:text-[14px] text-gray-600 mt-1 leading-relaxed">
                  Transforming computer science fundamentals into an engaging
                  learning experience.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
