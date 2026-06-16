import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-800">
      <div className="max-w-3xl w-full bg-white p-8 md:p-12 rounded-3xl shadow-sm border border-gray-100">
        <Link href="/" className="inline-flex items-center gap-2 text-[#F26522] hover:text-[#e05a1a] mb-8 font-bold text-sm">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <h1 className="text-3xl font-black text-gray-900 mb-6">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-8">Last updated: June 16, 2026</p>
        
        <div className="space-y-6 text-[15px] leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect personal information that you provide directly to us when registering for an account, updating your profile, or communicating with us. This includes your name, email address, phone number, and any documents provided for identity verification (KYC).</p>
          </section>
          
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use the information we collect to operate, maintain, and improve our services, communicate with you, process your transactions, verify your identity for safety, and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. We may share your information with trusted third-party service providers (like payment processors such as Razorpay) only as necessary to provide our services.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. Data Security</h2>
            <p>We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at privacy@educatorhub.example.com.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
