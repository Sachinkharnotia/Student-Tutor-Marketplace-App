"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { 
  BookOpen, Calendar, MessageSquare, Settings, LogOut, 
  Search, Bell, ChevronRight, Star, Clock, ShieldAlert, Lock, UserCheck, PlayCircle, X, CheckCircle, Paperclip, FileText 
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [tutors, setTutors] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("dashboard");

  // Booking Modal State
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Rating State
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    } 
    const parsed = JSON.parse(userData);
    setUser(parsed);
    setEditName(parsed.name);
    setEditEmail(parsed.email);

    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("receive_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
    });

    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    return () => { 
      newSocket.disconnect(); 
      document.body.removeChild(script);
    };
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    try {
      const [resTutors, resBookings] = await Promise.all([
        fetch("http://localhost:4000/api/marketplace/tutors", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/booking/my-bookings", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (resTutors.ok) setTutors(await resTutors.json());
      if (resBookings.ok) setBookings(await resBookings.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const handleBookSlot = async () => {
    if (!selectedTutor || !bookingDate || !bookingTime) return alert("Select date and time.");
    setIsBooking(true);
    const token = localStorage.getItem("token");
    const start = new Date(`${bookingDate}T${bookingTime}:00`);
    const end = new Date(start.getTime() + 60 * 60 * 1000); 

    try {
      const createRes = await fetch("http://localhost:4000/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tutorId: selectedTutor.id, startTime: start.toISOString(), endTime: end.toISOString(), amount: selectedTutor.hourlyRate })
      });
      const createData = await createRes.json();

      if (createRes.ok) {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder", // Replace with actual Razorpay Key
          amount: createData.booking.amount * 100,
          currency: "INR",
          name: "Educator Hub",
          description: `Session with ${selectedTutor.user.name}`,
          order_id: createData.orderId,
          handler: async function (response: any) {
            const verifyRes = await fetch("http://localhost:4000/api/booking/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ 
                bookingId: createData.booking.id, 
                razorpayPaymentId: response.razorpay_payment_id, 
                razorpayOrderId: response.razorpay_order_id, 
                razorpaySignature: response.razorpay_signature || "MOCK" 
              })
            });

            if (verifyRes.ok) {
              alert("Payment Successful! Booking Confirmed.");
              setSelectedTutor(null);
              setActiveTab('sessions');
              fetchData();
            }
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: { color: "#F26522" }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          alert("Payment Failed: " + response.error.description);
          setIsBooking(false);
        });
        rzp.open();
      }
    } catch (err) {
      console.error(err);
      setIsBooking(false);
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

  const markCompleted = async (bookingId: string) => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/booking/complete", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ bookingId })
    });
    if (res.ok) fetchData();
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
        setUser(data.user);
        localStorage.setItem("user", JSON.stringify(data.user));
        setToastMessage("Profile updated successfully!");
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

  const submitRating = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:4000/api/booking/rate", {
      method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ bookingId: ratingBooking.id, rating: ratingVal, comment: ratingComment })
    });
    if (res.ok) {
      alert("Review submitted!");
      setRatingBooking(null);
      fetchData();
    }
  };

  if (!user) return <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] text-gray-400 text-sm">Loading workspace...</div>;

  const isVerified = user.isVerified === true;

  const renderSidebar = () => (
    <div className="w-20 md:w-64 bg-white border-r border-gray-100 flex flex-col h-screen fixed left-0 top-0 transition-all z-20">
      <Link href="/" className="h-16 flex items-center justify-center md:justify-start md:px-6 gap-3 border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer">
        <div className="w-8 h-8 bg-gradient-to-tr from-[#F26522] to-[#ff8e5e] rounded-xl flex items-center justify-center shadow-sm shadow-orange-200">
          <BookOpen size={16} className="text-white" />
        </div>
        <span className="font-bold text-[15px] text-gray-900 hidden md:block">Marketplace</span>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <NavItem icon={<Calendar />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => {setActiveTab('dashboard'); setActiveChat(null);}} />
        <NavItem icon={<Search />} label="Browse Tutors" active={activeTab === 'tutors'} onClick={() => {setActiveTab('tutors'); setActiveChat(null);}} />
        <NavItem icon={<PlayCircle />} label="My Sessions" active={activeTab === 'sessions'} onClick={() => {setActiveTab('sessions'); setActiveChat(null);}} />
        <NavItem icon={<MessageSquare />} label="Messages" active={activeTab === 'messages'} onClick={() => setActiveTab('messages')} />
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
    <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-10">
      <div className="flex items-center bg-gray-100/80 rounded-full px-4 py-1.5 w-full max-w-xs border border-transparent focus-within:bg-white focus-within:border-orange-200 focus-within:ring-2 focus-within:ring-orange-50 transition-all">
        <Search size={14} className="text-gray-400" />
        <input type="text" placeholder="Search tutors..." className="bg-transparent border-none focus:outline-none ml-2 w-full text-[13px] text-gray-800 placeholder-gray-400" />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative text-gray-400 hover:text-gray-600 transition-colors w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <Bell size={16} />
          {bookings.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#F26522] rounded-full border border-white"></span>}
        </button>
        <div className="flex items-center gap-2 pl-4 border-l border-gray-100">
          <div className="flex flex-col items-end hidden md:flex">
            <span className="text-[13px] font-bold text-gray-800 leading-tight">{user.name}</span>
            <span className="text-[10px] text-gray-400 font-medium">{isVerified ? 'Verified' : 'Pending'}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-[#F26522] font-bold text-xs border border-orange-200/50 shadow-sm">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  );

  const renderDashboardTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-[13px] text-gray-500 mt-0.5">Track your learning progress today.</p>
        </div>
        {!isVerified ? (
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200/60 text-[11px] font-bold uppercase tracking-wide">
            <ShieldAlert size={12} /> Pending Verification
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full border border-emerald-200/60 text-[11px] font-bold uppercase tracking-wide">
            <UserCheck size={12} /> Verified Account
          </div>
        )}
      </div>

      {!isVerified && (
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-2xl p-5 md:p-6 border border-amber-100 shadow-sm mb-6 flex items-start gap-4">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
            <Lock size={16} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-[14px] font-bold text-gray-900">Account Restricted</h2>
            <p className="text-[13px] text-gray-600 mt-1 max-w-xl leading-relaxed">
              Admin verification is required before you can book tutors or chat. We are reviewing your profile.
            </p>
            <button onClick={fetchData} className="mt-3 text-amber-700 font-bold text-[12px] flex items-center gap-1 hover:text-amber-800">
              Refresh Status <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Upcoming" value={bookings.filter(b => b.status === 'CONFIRMED').length.toString()} icon={<Calendar size={16} className="text-[#F26522]"/>} bg="bg-orange-50" />
        <StatCard title="Hours" value={bookings.filter(b => b.status === 'COMPLETED').length.toString()} icon={<Clock size={16} className="text-blue-500"/>} bg="bg-blue-50" />
        <StatCard title="Completed" value={bookings.filter(b => b.status === 'COMPLETED').length.toString()} icon={<Star size={16} className="text-emerald-500"/>} bg="bg-emerald-50" className="col-span-2 md:col-span-1" />
      </div>
    </div>
  );

  const renderTutorsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Tutors</h1>
        <p className="text-[13px] text-gray-500 mt-0.5">Find the perfect educator.</p>
      </div>

      {!isVerified ? (
         <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
           <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 border border-gray-100">
             <Lock size={24} className="text-gray-400" />
           </div>
           <h3 className="text-[18px] font-bold text-gray-900">Browsing Locked</h3>
           <p className="text-[13px] text-gray-500 mt-2 max-w-sm leading-relaxed">Your profile is currently pending Admin approval. You must be verified before you can browse and book tutors.</p>
         </div>
      ) : tutors.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-[13px] shadow-sm">
          No tutors available right now.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tutors.map(tutor => (
            <div key={tutor.id} className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col shadow-sm hover:shadow-md hover:border-orange-100/50 transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="flex gap-3 items-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-[#F26522] font-bold text-[14px] border border-orange-100">
                    {tutor.user.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-[14px] font-bold text-gray-900 flex items-center gap-1">
                      {tutor.user.name} <UserCheck size={12} className="text-[#F26522]" />
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium truncate w-32">{tutor.subjects?.join(', ') || 'Math, CS'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                  <Star size={10} className="text-amber-400 fill-amber-400" /> 4.9
                </div>
              </div>
              
              <div className="text-[12px] text-gray-500 leading-relaxed mb-4 line-clamp-2 flex-1">
                {tutor.bio || 'Expert tutor dedicated to interactive and engaging digital classroom sessions.'}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                <div className="font-bold text-[15px] text-gray-900">${tutor.hourlyRate}<span className="text-gray-400 font-medium text-[11px]">/hr</span></div>
                <button onClick={() => setSelectedTutor(tutor)} className="bg-[#F26522] text-white px-4 py-1.5 rounded-lg text-[12px] font-bold hover:bg-[#e05a1a] transition shadow-sm">
                  Book
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTutor && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedTutor(null)} className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mb-4 text-[#F26522]">
              <Calendar size={20} />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 tracking-tight leading-none mb-1">Book Session</h2>
            <p className="text-gray-500 text-[13px] mb-6 font-medium">with {selectedTutor.user.name} • ${selectedTutor.hourlyRate}/hr</p>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Date</label>
                <input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none text-[13px] font-medium text-gray-800 transition-all" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Select Time</label>
                <input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none text-[13px] font-medium text-gray-800 transition-all" />
              </div>
            </div>

            <button onClick={handleBookSlot} disabled={isBooking} className="w-full bg-gray-900 text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-black transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-gray-900/10">
              {isBooking ? 'Processing...' : 'Pay with Razorpay'} <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderMessagesTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 flex flex-col h-[calc(100vh-140px)]">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Messages</h1>
      </div>

      <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm flex overflow-hidden">
        {!isVerified ? (
           <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gray-50/50">
             <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm border border-gray-100">
               <Lock size={18} className="text-gray-400" />
             </div>
             <h3 className="text-[15px] font-bold text-gray-900">Chat Locked</h3>
             <p className="text-[13px] text-gray-500 mt-1 max-w-xs leading-relaxed">Book a session to unlock real-time messaging.</p>
           </div>
        ) : (
          <div className="flex flex-col md:flex-row flex-1">
            <div className="w-full md:w-64 border-r border-gray-100 bg-gray-50/30 flex flex-col shrink-0">
              <div className="px-5 py-4 font-bold text-[13px] text-gray-800 border-b border-gray-100 flex items-center justify-between">
                Active Chats
                <span className="bg-orange-100 text-[#F26522] px-2 py-0.5 rounded-full text-[10px]">{bookings.filter(b => b.status === 'CONFIRMED').length}</span>
              </div>
              <div className="overflow-y-auto flex-1 p-2">
                {bookings.filter(b => b.status === 'CONFIRMED').length === 0 ? (
                  <div className="p-4 text-[12px] text-center text-gray-400 font-medium">No active bookings.</div>
                ) : (
                  bookings.filter(b => b.status === 'CONFIRMED').map(b => (
                    <div key={b.id} onClick={() => openChat(b)} className={`p-3 rounded-xl mb-1 cursor-pointer transition-all ${activeChat?.id === b.id ? 'bg-white shadow-sm border border-gray-100' : 'hover:bg-gray-100/50 border border-transparent'}`}>
                      <div className="font-bold text-[13px] text-gray-900 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                        {b.tutor.name}
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
                    <span className="font-bold text-[14px] text-gray-900">{activeChat.tutor.name}</span>
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
                  <p className="text-[13px] font-medium">Select a chat to start messaging</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderSessionsTab = () => (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Sessions</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {!isVerified ? (
          <div className="p-10 text-center flex flex-col items-center">
            <Lock size={32} className="text-gray-300 mb-3" />
            <h3 className="text-[15px] font-bold text-gray-900">Locked</h3>
            <p className="text-[13px] text-gray-500 mt-1">Admin approval is required.</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center">
            <Calendar size={32} className="text-gray-300 mb-3" />
            <h3 className="text-[15px] font-bold text-gray-900">No History</h3>
            <button onClick={() => setActiveTab('tutors')} className="mt-4 bg-[#F26522] text-white px-5 py-2 rounded-full text-[12px] font-bold hover:bg-[#e05a1a] transition shadow-sm">
              Find a Tutor
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tutor</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {bookings.map(b => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-5 py-4 font-bold text-[13px] text-gray-900">{b.tutor.name}</td>
                    <td className="px-5 py-4 text-[13px] text-gray-600 font-medium">{new Date(b.startTime).toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide rounded-md border ${
                        b.status === 'CONFIRMED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => markCompleted(b.id)} className="text-[#F26522] text-[12px] font-bold hover:underline">Complete</button>
                      )}
                      {b.status === 'COMPLETED' && (
                        <button onClick={() => setRatingBooking(b)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-black transition shadow-sm">Rate</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {ratingBooking && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setRatingBooking(null)} className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
            <h2 className="text-[18px] font-bold text-gray-900 tracking-tight leading-none mb-1">Rate Session</h2>
            <p className="text-gray-500 text-[13px] mb-6 font-medium">with {ratingBooking.tutor.name}</p>
            
            <div className="space-y-5 mb-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Rating</label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} onClick={() => setRatingVal(star)} className="p-1 hover:scale-110 transition-transform">
                      <Star size={24} className={star <= ratingVal ? 'text-amber-400 fill-amber-400' : 'text-gray-200'} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Review</label>
                <textarea value={ratingComment} onChange={e => setRatingComment(e.target.value)} rows={3} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 outline-none resize-none text-[13px] font-medium text-gray-800 transition-all" placeholder="How was it?"></textarea>
              </div>
            </div>

            <button onClick={submitRating} className="w-full bg-[#F26522] text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-[#e05a1a] transition flex items-center justify-center gap-2 shadow-md shadow-orange-500/20">
              Submit Review <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
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
            {activeTab === 'tutors' && renderTutorsTab()}
            {activeTab === 'messages' && renderMessagesTab()}
            {activeTab === 'sessions' && renderSessionsTab()}
            {activeTab === 'settings' && (
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm max-w-2xl animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-orange-100 to-orange-50 flex items-center justify-center text-[#F26522] font-bold text-2xl border border-orange-200/50 shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">{user.name}</h2>
                    <p className="text-[13px] text-gray-500 font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="space-y-5">
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
                      <p className="text-[13px] font-bold text-gray-900">Account Status</p>
                      <p className="text-[11px] text-gray-500 font-medium">Platform verification</p>
                    </div>
                    {isVerified ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-emerald-200/60">Verified</span>
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
