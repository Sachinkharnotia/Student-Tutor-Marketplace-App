"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { 
  Briefcase, Calendar, MessageSquare, Settings, LogOut, 
  Bell, FileText, CheckCircle, Clock, ShieldCheck, ChevronRight, X, Lock, Paperclip
} from "lucide-react";

export default function TutorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editHourlyRate, setEditHourlyRate] = useState("");
  const [editSubjects, setEditSubjects] = useState("");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [kycDocumentUrl, setKycDocumentUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [kycSubmitted, setKycSubmitted] = useState(false);

  // KYC Form State
  const [subject, setSubject] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [phone, setPhone] = useState("");

  // Booking & Chat State
  const [bookings, setBookings] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    }
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'TUTOR') {
      router.push("/login");
      return;
    }
    setUser(parsed);
    setEditName(parsed.name);
    setEditEmail(parsed.email);
    if (parsed.tutorProfile) {
      setEditPhone(parsed.tutorProfile.phone || "");
      setKycDocumentUrl(parsed.tutorProfile.kycDocument || "");
      setKycSubmitted(!!parsed.tutorProfile.phone);
      setEditHourlyRate(parsed.tutorProfile.hourlyRate?.toString() || "");
      setEditSubjects(parsed.tutorProfile.subjects?.join(", ") || "");
    }

    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);
    newSocket.on("receive_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });
    return () => { newSocket.disconnect(); };
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setKycSubmitted(!!data.user.tutorProfile?.phone);
        if (data.user.tutorProfile) {
          setEditPhone(data.user.tutorProfile.phone || "");
          setKycDocumentUrl(data.user.tutorProfile.kycDocument || "");
          setEditHourlyRate(data.user.tutorProfile.hourlyRate?.toString() || "");
          setEditSubjects(data.user.tutorProfile.subjects?.join(", ") || "");
        }
      }
      const bookingsRes = await fetch("http://localhost:4000/api/booking/tutor-bookings", { headers: { "Authorization": `Bearer ${token}` } });
      if (bookingsRes.ok) {
        const bookingsData = await bookingsRes.json();
        setBookings(bookingsData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user?.id) fetchData();
  }, [user?.id]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const [kycFormFile, setKycFormFile] = useState<File | null>(null);
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);

  const submitKYC = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingKyc(true);
    const token = localStorage.getItem("token");
    try {
      let docUrl = '';

      // Upload KYC document if provided
      if (kycFormFile) {
        const formData = new FormData();
        formData.append("file", kycFormFile);
        const uploadRes = await fetch("http://localhost:4000/api/upload", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          docUrl = uploadData.url;
        } else {
          setToastMessage("Failed to upload KYC document");
          setTimeout(() => setToastMessage(""), 3000);
          setIsSubmittingKyc(false);
          return;
        }
      }

      const subjectsArray = subject.split(',').map(s => s.trim()).filter(Boolean);
      const res = await fetch("http://localhost:4000/api/auth/submit-kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ subjects: subjectsArray, hourlyRate: parseFloat(hourlyRate), phone, kycDocument: docUrl || undefined })
      });
      if (res.ok) {
        setToastMessage("KYC Submitted! Waiting for Admin Approval.");
        setTimeout(() => setToastMessage(""), 4000);
        fetchData();
      } else {
        setToastMessage("Failed to submit KYC");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
      setToastMessage("Error submitting KYC");
      setTimeout(() => setToastMessage(""), 3000);
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const openChat = (booking: any) => {
    setActiveChat(booking);
    setChatMessages([]);
    if (socket) socket.emit("join_room", booking.id);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !activeChat || !socket) return;
    const messageData = { room: activeChat.id, senderId: user.id, message: chatInput };
    socket.emit("send_message", messageData);
    setChatMessages((prev) => [...prev, messageData]);
    setChatInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeChat || !socket) return;
    const file = e.target.files[0];
    const token = localStorage.getItem("token");
    
    setToastMessage("Uploading file...");
    const formData = new FormData();
    formData.append("file", file);
    
    try {
      const res = await fetch("http://localhost:4000/api/upload", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        const messageData = { room: activeChat.id, senderId: user.id, message: `[FILE] ${data.url}` };
        socket.emit("send_message", messageData);
        setChatMessages((prev) => [...prev, messageData]);
        setToastMessage("File sent!");
        setTimeout(() => setToastMessage(""), 3000);
      } else {
        setToastMessage("Upload failed");
        setTimeout(() => setToastMessage(""), 3000);
      }
    } catch (err) {
      setToastMessage("Upload error");
      setTimeout(() => setToastMessage(""), 3000);
    }
  };

  const updateProfile = async () => {
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    try {
      let finalDocUrl = kycDocumentUrl;

      // Handle file upload if a new file is selected
      if (kycFile) {
        const formData = new FormData();
        formData.append("file", kycFile);
        
        const uploadRes = await fetch("http://localhost:4000/api/upload", {
          method: "POST",
          headers: { "Authorization": `Bearer ${token}` },
          body: formData
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalDocUrl = uploadData.url;
          setKycDocumentUrl(finalDocUrl);
        } else {
          setToastMessage("Failed to upload document");
          setTimeout(() => setToastMessage(""), 3000);
          setIsUpdating(false);
          return;
        }
      }

      // Update base user details
      const res1 = await fetch("http://localhost:4000/api/auth/update", {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: editName, email: editEmail })
      });
      
      // Submit KYC details
      const res2 = await fetch("http://localhost:4000/api/profile/tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ 
          phone: editPhone, 
          kycDocument: finalDocUrl, 
          subjects: editSubjects.split(",").map(s => s.trim()).filter(Boolean), 
          hourlyRate: parseFloat(editHourlyRate) || 0 
        })
      });

      if (res1.ok && res2.ok) {
        setToastMessage("Profile & KYC updated successfully!");
        setTimeout(() => setToastMessage(""), 3000);
        
        // Refresh user data from API
        const meRes = await fetch("http://localhost:4000/api/auth/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (meRes.ok) {
           const { user } = await meRes.json();
           setUser(user);
           localStorage.setItem("user", JSON.stringify(user));
        }
      } else {
        setToastMessage("Failed to update profile");
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

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-gray-400 text-sm">Loading workspace...</div>;

  const isVerified = user.isVerified === true;

  const renderSidebar = () => (
    <div className="w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 transition-all z-20">
      <Link href="/" className="h-16 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-tr from-[#F26522] to-[#ff8e5e] rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
          <Briefcase size={16} className="text-white" />
        </div>
        <span className="font-bold text-[15px] text-gray-900 hidden md:block">Educator Hub</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<Calendar />} label="Overview" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setActiveChat(null);}} />
        <NavItem icon={<MessageSquare />} label="Student Chat" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} />
      </nav>

      <div className="p-3 border-t border-gray-100">
        <NavItem icon={<Settings />} label="Settings" active={activeTab === 'settings'} onClick={() => {setActiveTab('settings'); setActiveChat(null);}} />
        <button onClick={handleLogout} className="flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 text-xs font-semibold text-red-500 rounded-xl hover:bg-red-50 w-full transition-colors mt-1">
          <LogOut size={16} /> <span className="hidden md:block">Log out</span>
        </button>
      </div>
    </div>
  );

  const renderHeader = () => (
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-end px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
          >
            <Bell size={16} />
            {bookings.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F26522] rounded-full border border-white"></span>}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
              <h3 className="text-[13px] font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Bell size={14} className="text-[#F26522]" /> Notifications
              </h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {bookings.length > 0 ? bookings.map((b: any) => (
                  <div key={b.id} className="p-3 bg-gray-50 rounded-xl text-[12px]">
                    <span className="font-bold text-gray-800">{b.student?.name || 'Student'}</span>
                    <span className="text-gray-500 block mt-0.5">Session {b.status.toLowerCase()}</span>
                    <span className="text-[10px] text-gray-400 mt-1 block">{new Date(b.createdAt).toLocaleDateString()}</span>
                  </div>
                )) : (
                  <div className="text-[12px] text-gray-400 text-center py-4">No new notifications</div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-[13px] font-bold text-gray-800 leading-tight">{user.name}</span>
            <span className="text-[10px] text-gray-400 font-medium">Tutor</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-gray-700 font-bold text-xs border border-gray-200 shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );

  const renderDashboardTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tutor Overview</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Manage your classes and profile.</p>
      </div>

      {!kycSubmitted && !isVerified ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-[#F26522]">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-gray-900">Complete Your Profile</h2>
              <p className="text-[12px] text-gray-500 font-medium">Submit KYC details to start earning.</p>
            </div>
          </div>
          <form onSubmit={submitKYC} className="space-y-4 max-w-sm">
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subjects (comma separated)</label>
              <input type="text" required value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics, Physics, Chemistry" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none text-[13px] transition-all" />
              <p className="text-[10px] text-gray-400 mt-1">Add all subjects you can teach, separated by commas</p>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hourly Rate (₹)</label>
              <input type="number" required value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} placeholder="e.g. 500" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none text-[13px] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none text-[13px] transition-all" />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">KYC Document (ID Proof)</label>
              <input type="file" onChange={e => setKycFormFile(e.target.files ? e.target.files[0] : null)} className="w-full px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-bold file:bg-orange-50 file:text-[#F26522] hover:file:bg-orange-100" />
              <p className="text-[10px] text-gray-400 mt-1">Upload Aadhaar, PAN, or any government-issued ID</p>
            </div>
            <button type="submit" disabled={isSubmittingKyc} className="w-full bg-gray-900 text-white py-3 rounded-xl text-[13px] font-bold hover:bg-black transition shadow-sm mt-2 flex justify-center items-center gap-2 disabled:opacity-50">
              {isSubmittingKyc ? 'Submitting...' : 'Submit for Verification'} <ChevronRight size={14} />
            </button>
          </form>
        </div>
      ) : !isVerified ? (
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-6 md:p-8 border border-amber-100 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Clock size={20} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-gray-900">Verification Pending</h2>
            <p className="text-[13px] text-gray-600 mt-1 max-w-xl leading-relaxed">
              Your KYC documents have been submitted and are currently under review by our admin team. You will be able to accept students once verified.
            </p>
            <button onClick={fetchData} className="mt-4 bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg text-[12px] font-bold shadow-sm hover:bg-amber-50 transition">
              Check Status
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-5 md:p-6 border border-emerald-100 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="text-emerald-600" />
            </div>
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">Profile Active</h2>
              <p className="text-[12px] text-gray-600 font-medium">You are visible to students and can receive bookings.</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard title="Active Students" value={bookings.filter(b => b.status === 'CONFIRMED').length.toString()} icon={<MessageSquare size={16} className="text-[#F26522]"/>} bg="bg-orange-50" />
            <StatCard title="Total Sessions" value={bookings.length.toString()} icon={<Calendar size={16} className="text-blue-500"/>} bg="bg-blue-50" />
            <StatCard title="Earnings" value={`₹${bookings.filter(b => b.status === 'COMPLETED').reduce((acc, b) => acc + b.amount, 0)}`} icon={<CheckCircle size={16} className="text-emerald-500"/>} bg="bg-emerald-50" className="col-span-2 md:col-span-1" />
          </div>

          {/* My Rate & Subjects Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[14px] font-bold text-gray-900">My Rate & Subjects</h3>
              <button onClick={() => setActiveTab('settings')} className="text-[11px] font-bold text-[#F26522] hover:underline flex items-center gap-1">Edit <ChevronRight size={12} /></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hourly Rate</p>
                <p className="text-2xl font-black text-gray-900">₹{user.tutorProfile?.hourlyRate || 0}<span className="text-[12px] text-gray-400 font-medium">/hr</span></p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Subjects</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {(user.tutorProfile?.subjects || []).length > 0 ? (
                    user.tutorProfile.subjects.map((s: string, i: number) => (
                      <span key={i} className="bg-orange-50 text-[#F26522] px-2.5 py-1 rounded-lg text-[11px] font-bold border border-orange-100">{s}</span>
                    ))
                  ) : (
                    <span className="text-[12px] text-gray-400">No subjects set</span>
                  )}
                </div>
              </div>
            </div>
            {user.tutorProfile?.kycDocument && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">KYC Document</p>
                <a href={user.tutorProfile.kycDocument} target="_blank" rel="noopener noreferrer" className="text-[12px] font-bold text-indigo-600 hover:underline flex items-center gap-1.5">
                  <FileText size={14} /> View Uploaded Document
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  const renderChatTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Student Chats</h1>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden">
        {!isVerified ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
               <Lock size={18} className="text-gray-400" />
             </div>
             <h3 className="text-[15px] font-bold text-gray-900">Chat Locked</h3>
             <p className="text-[13px] text-gray-500 mt-1 max-w-xs leading-relaxed">Admin verification required to message students.</p>
           </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1">
            <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/30 flex flex-col shrink-0">
              <div className="px-5 py-4 font-bold text-[13px] text-gray-800 border-b border-gray-100 flex items-center justify-between">
                Active Bookings
                <span className="bg-orange-100 text-[#F26522] px-2 py-0.5 rounded-full text-[10px]">{bookings.filter(b => b.status === 'CONFIRMED').length}</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {bookings.filter(b => b.status === 'CONFIRMED').length === 0 ? (
                  <div className="p-4 text-[12px] text-center text-gray-400 font-medium">No active students.</div>
                ) : (
                  bookings.filter(b => b.status === 'CONFIRMED').map(b => (
                    <div key={b.id} onClick={() => openChat(b)} className={`p-3 rounded-xl mb-1 cursor-pointer transition-all ${activeChat?.id === b.id ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50 border border-transparent'}`}>
                      <div className="font-bold text-[13px] text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#F26522]"></div>
                        {b.student.name}
                      </div>
                      <div className="text-[11px] text-gray-500 mt-0.5 ml-4 font-medium">{new Date(b.startTime).toLocaleDateString()}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="flex-1 flex flex-col bg-white">
              {activeChat ? (
                <>
                  <div className="h-14 border-b border-gray-100 flex items-center px-5 shrink-0 bg-white z-10">
                    <span className="font-bold text-[14px] text-gray-900">{activeChat.student.name}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#fcfcfc]">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`px-4 py-2.5 rounded-2xl max-w-[75%] text-[13px] font-medium leading-relaxed ${msg.senderId === user.id ? 'bg-[#F26522] text-white rounded-br-sm shadow-sm' : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}>
                          {msg.message.startsWith('[FILE] ') ? (
                            <a href={msg.message.replace('[FILE] ', '')} target="_blank" className="flex items-center gap-2 hover:underline">
                              <FileText size={16} /> View Attachment
                            </a>
                          ) : (
                            msg.message
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-4 border-t border-gray-100 bg-white flex gap-3 shrink-0 items-center">
                    <input type="file" id="chat-upload" className="hidden" onChange={handleFileUpload} />
                    <label htmlFor="chat-upload" className="cursor-pointer text-gray-400 hover:text-[#F26522] transition-colors p-2 bg-gray-50 rounded-full">
                      <Paperclip size={18} />
                    </label>
                    <input 
                      type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..." 
                      className="flex-1 px-4 py-2.5 bg-gray-50 rounded-full border border-gray-200/60 outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 text-[13px] transition-all" 
                    />
                    <button onClick={sendMessage} className="bg-[#F26522] text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#e05a1a] transition-colors shadow-sm">
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                  <MessageSquare size={32} className="mb-3 opacity-40" />
                  <p className="text-[13px] font-medium">Select a student to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans selection:bg-orange-100 selection:text-orange-900">
      {renderSidebar()}
      <div className="flex-1 ml-20 md:ml-64 flex flex-col transition-all">
        {renderHeader()}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto">
            {activeTab === 'dashboard' && renderDashboardTab()}
            {activeTab === 'chat' && renderChatTab()}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-gray-100 to-gray-50 flex items-center justify-center text-gray-700 font-bold text-2xl border border-gray-200 shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user.name}</h2>
                    <p className="text-[13px] text-gray-500 font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-indigo-200 focus:ring-2 focus:ring-indigo-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">KYC Document Upload</label>
                    <div className="flex items-center gap-3">
                      <input type="file" onChange={(e) => setKycFile(e.target.files ? e.target.files[0] : null)} className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200 text-[13px] font-medium text-gray-800 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[12px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                      {kycDocumentUrl && <a href={kycDocumentUrl} target="_blank" className="text-indigo-600 text-[12px] font-bold hover:underline whitespace-nowrap">View Current</a>}
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Hourly Rate (₹)</label>
                    <input type="number" value={editHourlyRate} onChange={(e) => setEditHourlyRate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Subjects (comma separated)</label>
                    <input type="text" value={editSubjects} onChange={(e) => setEditSubjects(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all" placeholder="e.g. Mathematics, Physics, Chemistry" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Full Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">Educator Verification</p>
                      <p className="text-[11px] text-gray-500 font-medium">KYC & Admin Approval</p>
                    </div>
                    {isVerified ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-emerald-200/60">Active</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-amber-200/60">Pending</span>
                    )}
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
const NavItem = ({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-center md:justify-start gap-3 px-3 md:px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all ${
      active ? 'bg-orange-50 text-[#F26522]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <div className={`${active ? 'text-[#F26522]' : 'text-gray-400'}`}>
      {React.cloneElement(icon as React.ReactElement, { size: 16 } as any)}
    </div>
    <span className="hidden md:block">{label}</span>
  </button>
);

const StatCard = ({ title, value, icon, bg, className = "" }: { title: string, value: string, icon: React.ReactNode, bg: string, className?: string }) => (
  <div className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex flex-col gap-3 ${className}`}>
    <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
      {icon}
    </div>
    <div>
      <p className="text-[12px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">{title}</p>
      <h4 className="text-[22px] font-black text-gray-900 leading-none">{value}</h4>
    </div>
  </div>
);
