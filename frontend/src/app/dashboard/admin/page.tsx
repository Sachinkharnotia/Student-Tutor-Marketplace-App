"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, CheckCircle, XCircle, Users, Activity, LogOut, ChevronRight, Check, CreditCard, AlertTriangle, PlayCircle, BarChart2, Download, FileText
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("verification");
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

  // Force download helper for cross-origin files (Cloudinary)
  const forceDownload = async (url: string) => {
    const token = localStorage.getItem("token");
    try {
      setToastMessage("Downloading file...");
      setTimeout(() => setToastMessage(""), 5000);
      const res = await fetch(`http://localhost:4000/api/upload/download?url=${encodeURIComponent(url)}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const urlParts = url.split('/');
      a.download = decodeURIComponent(urlParts[urlParts.length - 1].split('?')[0]) || 'download';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setToastMessage("File downloaded!");
      setTimeout(() => setToastMessage(""), 3000);
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
      setToastMessage("Opened file in new tab (download failed)");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    const token = localStorage.getItem("token");
    try {
      const meRes = await fetch("http://localhost:4000/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } });
      if (meRes.ok) {
        const data = await meRes.json();
        if (data.user.role !== 'ADMIN') return router.push("/login");
        setAdminUser(data.user);
      } else return router.push("/login");

      const [stuRes, tutRes, usersRes, payRes, dispRes, analyticsRes] = await Promise.all([
        fetch("http://localhost:4000/api/admin/pending-students", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/pending-tutors", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/payments", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/disputes", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/analytics", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (stuRes.ok) setPendingStudents(await stuRes.json());
      if (tutRes.ok) setPendingTutors(await tutRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (dispRes.ok) setDisputes(await dispRes.json());
      if (analyticsRes.ok) setAnalyticsData(await analyticsRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const apiPost = async (url: string, body: any) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        const data = await res.json();
        setToastMessage(data.message || "Success");
        setTimeout(() => setToastMessage(""), 3000);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleVerifyStudent = (studentProfileId: string, status: string) => apiPost("http://localhost:4000/api/admin/verify-student", { studentProfileId, status });
  const handleVerifyTutor = (tutorProfileId: string, status: string) => apiPost("http://localhost:4000/api/admin/verify-tutor", { tutorProfileId, status });
  const handleSuspend = (userId: string, isSuspended: boolean) => apiPost("http://localhost:4000/api/admin/suspend", { userId, isSuspended });
  const handleRefund = (bookingId: string) => apiPost("http://localhost:4000/api/admin/refund", { bookingId });
  const handleResolveDispute = (disputeId: string) => apiPost("http://localhost:4000/api/admin/resolve-dispute", { disputeId });

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  if (!adminUser) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-gray-400 text-sm">Loading admin workspace...</div>;

  const renderSidebar = () => (
    <div className="w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 transition-all z-20">
      <Link href="/" className="h-16 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-gray-100 hover:bg-orange-50 transition-colors cursor-pointer">
        <div className="w-8 h-8 bg-[#F26522] rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
          <Shield size={16} className="text-white" />
        </div>
        <span className="font-bold text-[15px] text-gray-800 hidden md:block">Admin Portal</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<CheckCircle />} label="Verification Queue" active={activeTab === 'verification'} onClick={() => setActiveTab('verification')} />
        <NavItem icon={<Users />} label="User Management" active={activeTab === 'users'} onClick={() => setActiveTab('users')} />
        <NavItem icon={<CreditCard />} label="Payments & Refunds" active={activeTab === 'payments'} onClick={() => setActiveTab('payments')} />
        <NavItem icon={<AlertTriangle />} label="Disputes" active={activeTab === 'disputes'} onClick={() => setActiveTab('disputes')} />
        <NavItem icon={<BarChart2 />} label="Analytics" active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} />
      </nav>

      <div className="p-3 border-t border-gray-100">
        <button onClick={handleLogout} className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 text-xs font-semibold text-rose-500 rounded-xl hover:bg-rose-50 w-full transition-colors mt-1">
          <LogOut size={16} /> <span className="hidden md:block">Log out</span>
        </button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-[13px] font-bold text-gray-800 leading-tight">{adminUser.name}</span>
            <span className="text-[10px] text-[#F26522] font-bold tracking-widest uppercase">System Admin</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-[#F26522] font-bold text-xs border border-orange-200 shadow-sm">
            {adminUser.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );

  const renderVerificationTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Verification Queue</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Review and approve new students and tutors.</p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-[15px] font-bold text-gray-900">Pending Tutors</h2>
            <span className="bg-orange-100 text-[#F26522] text-[11px] font-bold px-2.5 py-0.5 rounded-full">{pendingTutors.length}</span>
          </div>
          <div className="p-6 flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-100 rounded w-32"></div>
                      </div>
                      <div className="text-right">
                        <div className="h-3 bg-gray-100 rounded w-16 mb-1"></div>
                        <div className="h-4 bg-gray-200 rounded w-12 ml-auto"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                      <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingTutors.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-8">No tutors pending verification.</p> : (
              <div className="space-y-4">
                {pendingTutors.map(tutor => (
                  <div key={tutor.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">{tutor.user.name}</p>
                        <p className="text-[12px] text-gray-500">{tutor.user.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-bold text-gray-400 uppercase">Hourly Rate</p>
                        <p className="text-[13px] font-bold text-gray-900">${tutor.hourlyRate || 0}/hr</p>
                      </div>
                    </div>
                    {tutor.kycDocument && (
                      <div className="flex items-center gap-2">
                        <a href={tutor.kycDocument} target="_blank" className="text-[12px] font-bold text-[#F26522] hover:underline flex items-center gap-1">
                          <FileText size={12} /> View KYC <ChevronRight size={12} />
                        </a>
                        <button onClick={() => forceDownload(tutor.kycDocument)} className="text-[12px] font-bold text-emerald-600 hover:underline flex items-center gap-1 transition">
                          <Download size={12} /> Download
                        </button>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleVerifyTutor(tutor.id, 'APPROVED')} className="flex-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-200/50">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleVerifyTutor(tutor.id, 'REJECTED')} className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 rounded-lg text-[12px] font-bold transition flex items-center justify-center gap-1">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center rounded-t-2xl">
            <h2 className="text-[15px] font-bold text-gray-900">Pending Students</h2>
            <span className="bg-orange-100 text-[#F26522] text-[11px] font-bold px-2.5 py-0.5 rounded-full">{pendingStudents.length}</span>
          </div>
          <div className="p-6 flex-1">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <div key={i} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-3 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-3 bg-gray-100 rounded w-32"></div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                      <div className="h-8 bg-gray-100 rounded-lg flex-1"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : pendingStudents.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-8">No students pending verification.</p> : (
              <div className="space-y-4">
                {pendingStudents.map(student => (
                  <div key={student.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex flex-col gap-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[14px] font-bold text-gray-900">{student.user.name}</p>
                        <p className="text-[12px] text-gray-500">{student.user.email}</p>
                        {student.phone && <p className="text-[12px] text-gray-500 font-medium">Phone: {student.phone}</p>}
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleVerifyStudent(student.id, 'APPROVED')} className="flex-1 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-200/50">
                        <Check size={14} /> Approve
                      </button>
                      <button onClick={() => handleVerifyStudent(student.id, 'REJECTED')} className="flex-1 bg-rose-50 text-rose-600 hover:bg-rose-100 py-2 rounded-lg text-[12px] font-bold transition flex items-center justify-center gap-1">
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsersTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">User Management</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage all registered users, suspend or unsuspend access.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-4">User</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Suspension</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-28 mb-1"></div>
                    <div className="h-3 bg-gray-100 rounded w-36"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-100 rounded-md w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-6 bg-gray-100 rounded-md w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-8 bg-gray-100 rounded-lg w-20 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : allUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <p className="text-[12px] text-gray-500">{u.email}</p>
                </td>
                <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-bold text-[11px]">{u.role}</span></td>
                <td className="px-6 py-4 font-medium">
                  {u.role === 'STUDENT' ? (
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                      u.studentProfile?.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      u.studentProfile?.status === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>{u.studentProfile?.status || 'PENDING'}</span>
                  ) : u.role === 'TUTOR' ? (
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase ${
                      u.tutorProfile?.kycStatus === 'APPROVED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      u.tutorProfile?.kycStatus === 'REJECTED' ? 'bg-rose-50 text-rose-700 border border-rose-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>{u.tutorProfile?.kycStatus || 'PENDING'}</span>
                  ) : (
                    <span className="text-gray-400 font-bold">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {u.isSuspended ? <span className="text-rose-500 font-bold">Suspended</span> : <span className="text-emerald-500 font-bold">Active</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {u.role !== 'ADMIN' && (
                    <button 
                      onClick={() => handleSuspend(u.id, !u.isSuspended)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-[11px] transition ${u.isSuspended ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}
                    >
                      {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPaymentsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Payments & Refunds</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Track platform bookings and manage refund processing.</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-500 font-bold">
            <tr>
              <th className="px-6 py-4">Booking ID</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Tutor</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Refund</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-emerald-100 rounded w-12"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="h-8 bg-gray-100 rounded-lg w-24 ml-auto"></div>
                  </td>
                </tr>
              ))
            ) : payments.map(p => (
              <tr key={p.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4 font-mono text-gray-400 text-[11px]">{p.id.substring(0,8)}...</td>
                <td className="px-6 py-4 font-bold text-gray-800">{p.student?.name}</td>
                <td className="px-6 py-4 font-bold text-gray-800">{p.tutor?.name}</td>
                <td className="px-6 py-4 font-bold text-emerald-600">${p.amount}</td>
                <td className="px-6 py-4 font-bold text-gray-500">{p.status}</td>
                <td className="px-6 py-4 font-bold">
                  {p.refundStatus === 'REFUNDED' ? <span className="text-emerald-500">Refunded</span> : <span className="text-gray-400">None</span>}
                </td>
                <td className="px-6 py-4 text-right">
                  {p.refundStatus !== 'REFUNDED' && p.paymentStatus !== 'FAILED' && (
                    <button 
                      onClick={() => handleRefund(p.id)}
                      className="px-3 py-1.5 rounded-lg font-bold text-[11px] bg-orange-50 text-[#F26522] hover:bg-orange-100 transition"
                    >
                      Process Refund
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!isLoading && payments.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No transactions found.</p>}
      </div>
    </div>
  );

  const renderDisputesTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Active Disputes</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Review and resolve reported issues.</p>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {isLoading ? (
          [1, 2, 3].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between animate-pulse">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-4 w-16 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-100 rounded"></div>
                </div>
                <div className="h-4 w-2/3 bg-gray-200 rounded"></div>
                <div className="h-3 w-1/2 bg-gray-100 rounded"></div>
              </div>
              <div className="h-9 w-28 bg-gray-100 rounded-lg ml-4"></div>
            </div>
          ))
        ) : disputes.length === 0 ? <p className="text-gray-400 text-sm">No disputes submitted.</p> : disputes.map(d => (
          <div key={d.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${d.status === 'RESOLVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  {d.status}
                </span>
                <span className="text-[12px] text-gray-400 font-mono">Booking: {d.bookingId.substring(0,8)}</span>
              </div>
              <p className="text-[14px] text-gray-900 font-medium">{d.reason}</p>
              <p className="text-[12px] text-gray-500 mt-1">Between <b>{d.booking.student.name}</b> and <b>{d.booking.tutor.name}</b></p>
            </div>
            {d.status !== 'RESOLVED' && (
              <button 
                onClick={() => handleResolveDispute(d.id)}
                className="bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-4 py-2 rounded-lg text-[13px] font-bold transition flex items-center gap-2"
              >
                <Check size={16} /> Mark Resolved
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderAnalyticsTab = () => {
    if (isLoading) {
      return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analytics</h1>
            <p className="text-[13px] text-gray-500 mt-0.5">Platform performance overview and trends.</p>
          </div>
          {/* Stat Cards Skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 animate-pulse">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div>
                  <div className="h-3 bg-gray-100 rounded w-20 mb-1.5"></div>
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
          {/* Charts Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse">
                <div className="mb-4">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-1.5"></div>
                  <div className="h-3 bg-gray-100 rounded w-48"></div>
                </div>
                <div className="h-[220px] bg-gray-50 rounded-xl flex items-end justify-between p-4">
                  {Array.from({ length: 8 }).map((_, colIdx) => (
                    <div key={colIdx} className="w-6 bg-gray-200 rounded-t" style={{ height: `${20 + colIdx * 8}%` }}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (!analyticsData) return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Platform performance overview.</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <BarChart2 size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-[13px] text-gray-400">Analytics data unavailable. Ensure the API endpoint is active.</p>
        </div>
      </div>
    );

    const chartData = Object.entries(analyticsData.monthlyData || {}).map(([month, data]: any) => ({
      name: new Date(month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }),
      bookings: data.bookings,
      revenue: data.revenue
    }));

    const statCards = [
      { label: 'Total Users', value: analyticsData.totalUsers ?? 0, bg: 'bg-orange-50', text: 'text-[#F26522]', border: 'border-orange-100', icon: <Users size={20} className="text-[#F26522]" /> },
      { label: 'Students', value: analyticsData.totalStudents ?? 0, bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <CheckCircle size={20} className="text-blue-500" /> },
      { label: 'Tutors', value: analyticsData.totalTutors ?? 0, bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-100', icon: <Activity size={20} className="text-violet-500" /> },
      { label: 'Total Revenue', value: `$${(analyticsData.totalRevenue ?? 0).toLocaleString()}`, bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: <CreditCard size={20} className="text-emerald-500" /> },
    ];

    return (
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Analytics</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Platform performance overview and trends.</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card) => (
            <div key={card.label} className={`bg-white rounded-2xl border ${card.border} shadow-sm p-5 flex flex-col gap-3`}>
              <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center`}>
                {card.icon}
              </div>
              <div>
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">{card.label}</p>
                <p className={`text-2xl font-bold ${card.text} mt-0.5`}>{card.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Bookings */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">Monthly Bookings</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Total sessions booked per month</p>
            </div>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    cursor={{ fill: '#fef3ec' }}
                  />
                  <Bar dataKey="bookings" name="Bookings" fill="#F26522" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Monthly Revenue */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="mb-4">
              <h2 className="text-[15px] font-bold text-gray-900">Monthly Revenue</h2>
              <p className="text-[12px] text-gray-400 mt-0.5">Total revenue collected per month (USD)</p>
            </div>
            {chartData.length === 0 ? (
              <div className="h-[200px] flex items-center justify-center text-gray-300 text-sm">No data available</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.06)' }}
                    formatter={(value: any) => [`$${value}`, 'Revenue']}
                    cursor={{ stroke: '#F26522', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="Revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                    activeDot={{ r: 6, fill: '#10b981', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Summary Row */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-[15px] font-bold text-gray-900 mb-4">Platform Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{analyticsData.totalBookings ?? 0}</p>
              <p className="text-[12px] text-gray-400 mt-1 font-semibold">Total Bookings</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-[#F26522]">{analyticsData.totalTutors ?? 0}</p>
              <p className="text-[12px] text-gray-400 mt-1 font-semibold">Active Tutors</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-500">{analyticsData.totalStudents ?? 0}</p>
              <p className="text-[12px] text-gray-400 mt-1 font-semibold">Enrolled Students</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-500">
                {analyticsData.totalBookings > 0 ? `$${(analyticsData.totalRevenue / analyticsData.totalBookings).toFixed(0)}` : '$0'}
              </p>
              <p className="text-[12px] text-gray-400 mt-1 font-semibold">Avg. Revenue / Booking</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans selection:bg-orange-100 selection:text-orange-900">
      {renderSidebar()}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col transition-all">
        {renderHeader()}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'verification' && renderVerificationTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'payments' && renderPaymentsTab()}
            {activeTab === 'disputes' && renderDisputesTab()}
            {activeTab === 'analytics' && renderAnalyticsTab()}
          </div>
        </main>
      </div>

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50">
          <CheckCircle size={18} className="text-emerald-400" />
          <span className="text-[13px] font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all ${
      active ? 'bg-orange-50 text-[#F26522]' : 'text-gray-400 hover:bg-gray-50 hover:text-gray-600'
    }`}
  >
    <div className={`${active ? 'text-[#F26522]' : 'text-gray-400'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 18 } as any)}
    </div>
    <span className="hidden md:block">{label}</span>
  </button>
);
