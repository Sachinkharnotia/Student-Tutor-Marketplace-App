import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl w-full bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-[#F26522] hover:text-[#e05a1a] mb-8 font-bold text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-6">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 16, 2026</p>
        
        <div className="space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>By accessing and using Educator Hub, you accept and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our services.</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. Tutors must provide accurate KYC information and maintain professional conduct.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Payments and Refunds</h2>
            <p>All payments for tutoring sessions are processed securely through our third-party payment processor (Razorpay). Refunds are governed by our refund policy and are at the discretion of Educator Hub administration.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to use the platform for any unlawful purpose, to harass or abuse other users, or to distribute malicious software or spam.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Modifications</h2>
            <p>We reserve the right to modify these terms at any time. Your continued use of the platform following the posting of changes constitutes your acceptance of those changes.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
