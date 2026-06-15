"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ShieldAlert, Users, BookOpen, Settings, LogOut, CheckCircle, XCircle 
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [pendingStudents, setPendingStudents] = useState<any[]>([]);
  const [pendingTutors, setPendingTutors] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("students");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== "ADMIN") {
      alert("Unauthorized Access!");
      router.push("/login");
      return;
    }
    setAdmin(parsed);
    setEditName(parsed.name);
    setEditEmail(parsed.email);
    fetchPendingUsers();
  }, [router]);

  const fetchPendingUsers = async () => {
    const token = localStorage.getItem("token");
    try {
      const [sRes, tRes] = await Promise.all([
        fetch("http://localhost:4000/api/admin/pending-students", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/admin/pending-tutors", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      if (sRes.ok) setPendingStudents(await sRes.json());
      if (tRes.ok) setPendingTutors(await tRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const approveUser = async (userId: string, isTutor: boolean) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/admin/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, isVerified: true })
      });
      if (res.ok) {
        if (isTutor) setPendingTutors(prev => prev.filter(t => t.userId !== userId));
        else setPendingStudents(prev => prev.filter(s => s.id !== userId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      if (res.ok) {
        const data = await res.json();
        setAdmin(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToastMessage("Admin profile updated successfully!");
        setTimeout(() => setToastMessage(""), 3000);
      } else {
        const err = await res.json();
        setToastMessage(err.error || "Failed to update profile");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (error) {
      console.error(error);
      setToastMessage("Error updating profile");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsUpdating(false);
    }
  };

  if (!admin) return <div className="min-h-screen flex items-center justify-center bg-[#111] text-gray-400 text-sm">Loading admin systems...</div>;

  const renderSidebar = () => (
    <div className="w-20 md:w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-screen fixed left-0 top-0 text-white transition-all z-20 shadow-2xl shadow-gray-900/50">
      <Link href="/" className="h-16 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-gray-800 hover:bg-gray-800/50 transition-colors cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-tr from-red-500 to-red-400 rounded-xl flex items-center justify-center shadow-sm shadow-red-500/20">
          <ShieldAlert size={16} className="text-white" />
        </div>
        <span className="font-bold text-[15px] tracking-tight hidden md:block">Admin HQ</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<Users />} label="Pending Students" count={pendingStudents.length} active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
        <NavItem icon={<BookOpen />} label="Pending Tutors" count={pendingTutors.length} active={activeTab === 'tutors'} onClick={() => setActiveTab('tutors')} />
      </nav>

      <div className="p-3 border-t border-gray-800">
        <NavItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        <button onClick={handleLogout} className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 text-xs font-semibold text-gray-400 rounded-xl hover:bg-red-500/10 hover:text-red-400 w-full transition-colors mt-1">
          <LogOut size={16} /> <span className="hidden md:block">System Exit</span>
        </button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <header className="h-16 bg-gray-50/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-end px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-end hidden md:flex">
          <span className="text-[13px] font-bold text-gray-800 leading-tight">System Admin</span>
          <span className="text-[10px] text-gray-400 font-medium">Root Access</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-100 to-red-50 flex items-center justify-center text-red-600 font-bold text-xs border border-red-200 shadow-sm ml-2">
          S
        </div>
      </div>
    </header>
  );

  const renderStudentsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Student Queue</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Approve new students to allow platform access.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pendingStudents.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <CheckCircle size={32} className="text-emerald-300 mb-3" />
            <h3 className="text-[15px] font-bold text-gray-900">All Caught Up</h3>
            <p className="text-[13px] text-gray-500 mt-1">No pending students awaiting approval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingStudents.map(student => (
                  <tr key={student.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4 font-bold text-[13px] text-gray-900">{student.name}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 font-medium">{student.email}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-4 text-right">
                      <button onClick={() => approveUser(student.id, false)} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-200/50">
                        Approve & Activate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderTutorsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tutor KYC Queue</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Review educator credentials before activation.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {pendingTutors.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <CheckCircle size={32} className="text-emerald-300 mb-3" />
            <h3 className="text-[15px] font-bold text-gray-900">Queue Empty</h3>
            <p className="text-[13px] text-gray-500 mt-1">No tutor KYC submissions pending.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tutor Name</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Subjects</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Rate</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pendingTutors.map(tutor => (
                  <tr key={tutor.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4 font-bold text-[13px] text-gray-900">{tutor.user.name}</td>
                    <td className="px-5 py-4 text-[12px] font-medium text-gray-600">
                      <span className="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">{tutor.subjects.join(', ')}</span>
                    </td>
                    <td className="px-5 py-4 text-[13px] font-bold text-emerald-600">${tutor.hourlyRate}/hr</td>
                    <td className="px-5 py-4 text-[13px] text-gray-500">{tutor.phone}</td>
                    <td className="px-5 py-4 text-right flex justify-end gap-2">
                      <button onClick={() => approveUser(tutor.userId, true)} className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition shadow-sm border border-emerald-200/50">
                        Approve KYC
                      </button>
                      <button className="bg-red-50 text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-100 transition border border-red-100">
                        <XCircle size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex font-sans selection:bg-red-100 selection:text-red-900">
      {renderSidebar()}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col transition-all">
        {renderHeader()}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'students' && renderStudentsTab()}
            {activeTab === 'tutors' && renderTutorsTab()}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-200 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-red-100 to-red-50 flex items-center justify-center text-red-600 font-bold text-2xl border border-red-200 shadow-sm">
                    {admin.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{admin.name}</h2>
                    <p className="text-[13px] text-gray-500 font-medium">{admin.email}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Admin Email</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-red-200 focus:ring-2 focus:ring-red-50 transition-all" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">System Access Level</p>
                      <p className="text-[11px] text-gray-500 font-medium">Root / Full Permissions</p>
                    </div>
                    <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-red-200/60">Admin</span>
                  </div>
                </div>

                <button onClick={updateProfile} disabled={isUpdating} className="mt-8 bg-gray-900 text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-black transition shadow-sm w-full md:w-auto disabled:opacity-50">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>
              </div>
            )}
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

// --- Helper Components ---
const NavItem = ({ icon, label, count, active, onClick }: { icon: React.ReactNode, label: string, count?: number, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
      active ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
    }`}
  >
    <div className={`${active ? 'text-white' : 'text-gray-500'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 16 } as any)}
    </div>
    <span className="hidden md:block flex-1 text-left">{label}</span>
    {count !== undefined && count > 0 && (
      <span className="hidden md:flex bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] justify-center items-center">
        {count}
      </span>
    )}
  </button>
);
