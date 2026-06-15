"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, CheckCircle, XCircle, Users, Activity, LogOut, ChevronRight, Check, CreditCard, AlertTriangle, PlayCircle
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("verification");
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState("");

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

      const [stuRes, tutRes, usersRes, payRes, dispRes] = await Promise.all([
        fetch("http://localhost:4000/api/admin/pending-students", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/pending-tutors", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/users", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/payments", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/disputes", { headers: { "Authorization": `Bearer ${token}` } })
      ]);

      if (stuRes.ok) setPendingStudents(await stuRes.json());
      if (tutRes.ok) setPendingTutors(await tutRes.json());
      if (usersRes.ok) setAllUsers(await usersRes.json());
      if (payRes.ok) setPayments(await payRes.json());
      if (dispRes.ok) setDisputes(await dispRes.json());
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

  const handleVerifyStudent = (userId: string) => apiPost("http://localhost:4000/api/admin/verify-student", { userId });
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
            {pendingTutors.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-8">No tutors pending verification.</p> : (
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
                      <a href={tutor.kycDocument} target="_blank" className="text-[12px] font-bold text-[#F26522] hover:underline flex items-center gap-1">
                        View KYC Document <ChevronRight size={12} />
                      </a>
                    )}
                    <div className="flex gap-2 mt-2 pt-3 border-t border-gray-100">
                      <button onClick={() => handleVerifyTutor(tutor.id, 'APPROVED')} className="flex-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 py-2 rounded-lg text-[12px] font-bold transition flex items-center justify-center gap-1">
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
            {pendingStudents.length === 0 ? <p className="text-[13px] text-gray-400 text-center py-8">No students pending verification.</p> : (
              <div className="space-y-4">
                {pendingStudents.map(student => (
                  <div key={student.id} className="p-4 border border-gray-100 rounded-xl bg-white shadow-sm flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-bold text-gray-900">{student.name}</p>
                      <p className="text-[12px] text-gray-500">{student.email}</p>
                    </div>
                    <button onClick={() => handleVerifyStudent(student.id)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg text-[12px] font-bold transition flex items-center gap-1">
                      <Check size={14} /> Verify
                    </button>
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
            {allUsers.map(u => (
              <tr key={u.id} className="hover:bg-gray-50/50 transition">
                <td className="px-6 py-4">
                  <p className="font-bold text-gray-900">{u.name}</p>
                  <p className="text-[12px] text-gray-500">{u.email}</p>
                </td>
                <td className="px-6 py-4"><span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md font-bold text-[11px]">{u.role}</span></td>
                <td className="px-6 py-4">
                  {u.isVerified ? <span className="text-emerald-500 font-bold flex items-center gap-1"><CheckCircle size={14}/> Verified</span> : <span className="text-gray-400 font-bold flex items-center gap-1"><Activity size={14}/> Pending</span>}
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
            {payments.map(p => (
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
        {payments.length === 0 && <p className="text-center py-8 text-gray-400 text-sm">No transactions found.</p>}
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
        {disputes.length === 0 ? <p className="text-gray-400 text-sm">No disputes submitted.</p> : disputes.map(d => (
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
