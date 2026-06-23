"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { 
  BookOpen, Calendar, MessageSquare, Settings, LogOut, 
  Search, Bell, ChevronRight, Star, Clock, ShieldAlert, Lock, UserCheck, PlayCircle, X, CheckCircle, Paperclip, FileText, Trash2, AlertTriangle, Download 
} from "lucide-react";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const [tutors, setTutors] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [activeTab, _setActiveTab] = useState("dashboard");
  const setActiveTab = (tab: string) => {
    _setActiveTab(tab);
    localStorage.setItem("activeTab", tab);
    if (tab !== 'messages') {
      setActiveChat(null);
      localStorage.removeItem("activeChatId");
    }
  };
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterSortBy, setFilterSortBy] = useState("");

  // Booking Modal State
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Rating & Dispute Modal State
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingVal, setRatingVal] = useState(5);
  };
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Filters
  const [filterSearch, setFilterSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");
  const [filterSortBy, setFilterSortBy] = useState("");

  // Booking Modal State
  const [selectedTutor, setSelectedTutor] = useState<any>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [isBooking, setIsBooking] = useState(false);

  // Rating & Dispute Modal State
  const [ratingBooking, setRatingBooking] = useState<any>(null);
  const [ratingVal, setRatingVal] = useState(5);
  const [ratingComment, setRatingComment] = useState("");
  
  const [disputeBooking, setDisputeBooking] = useState<any>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  // Chat State
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatPage, setChatPage] = useState(1);
  const [chatTotalPages, setChatTotalPages] = useState(1);
  const [isFetchingChat, setIsFetchingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchChatHistory = async (roomId: string, pageNum: number, append = false) => {
    const token = localStorage.getItem("token");
    setIsFetchingChat(true);
    try {
      const res = await fetch(`http://localhost:4000/api/chat/${roomId}/messages?page=${pageNum}&limit=20`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setChatMessages(prev => [...data.data, ...prev]);
        } else {
          setChatMessages(data.data || []);
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "instant" as any });
          }, 50);
        }
        setChatPage(data.pagination.page);
        setChatTotalPages(data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch chat history:", err);
    } finally {
      setIsFetchingChat(false);
    }
  };

  // Force download helper for cross-origin files (Cloudinary)
  const forceDownload = async (url: string) => {
    const token = localStorage.getItem("token");
    try {
      showToast("Downloading file...", "info");
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
      showToast("File downloaded!", "success");
    } catch (err) {
      console.error('Download error:', err);
      window.open(url, '_blank');
      showToast("Opened file in new tab (download failed)", "info");
    }
  };

  useEffect(() => {
    if (user && user.studentProfile) {
      setPhone(user.studentProfile.phone || "");
    }
  }, [user]);

  const handleCompleteProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return showToast("Please enter your phone number.", "error");
    setIsUpdating(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/profile/student", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ phone })
      });
      if (res.ok) {
        showToast("Profile completed! Sent for admin approval.", "success");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to update profile", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error updating profile", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/login");
      return;
    } 
    const parsed = JSON.parse(userData);
    if (parsed.role !== 'STUDENT') {
      router.push("/login");
      return;
    }
    setUser(parsed);
    setEditName(parsed.name);
    setEditEmail(parsed.email);

    // Restore active tab
    const savedTab = localStorage.getItem("activeTab");
    if (savedTab) {
      _setActiveTab(savedTab);
    }

    const newSocket = io("http://localhost:4000");
    setSocket(newSocket);

    newSocket.on("receive_message", (data) => {
      setChatMessages((prev) => [...prev, data]);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
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

  useEffect(() => {
    if (socket && activeChat) {
      socket.emit("join_room", activeChat.id);
    }
  }, [socket, activeChat?.id]);

  const fetchTutors = async () => {
    const token = localStorage.getItem("token");
    try {
      const params = new URLSearchParams();
      if (filterSearch) params.append("search", filterSearch);
      if (filterSubject) params.append("subject", filterSubject);
      if (filterMinPrice) params.append("minPrice", filterMinPrice);
      if (filterMaxPrice) params.append("maxPrice", filterMaxPrice);
      if (filterSortBy) params.append("sortBy", filterSortBy);

      const res = await fetch(`http://localhost:4000/api/marketplace/tutors?${params.toString()}`, { 
        headers: { "Authorization": `Bearer ${token}` } 
      });
      if (res.ok) {
        const data = await res.json();
        setTutors(Array.isArray(data) ? data : data.data || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const submitDispute = async () => {
    if (!disputeReason) return showToast("Reason is required", "error");
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/dispute/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ bookingId: disputeBooking.id, reason: disputeReason })
      });
      if (res.ok) {
        showToast("Dispute submitted.", "success");
        setDisputeBooking(null);
        setDisputeReason("");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to submit dispute", "error");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    const token = localStorage.getItem("token");
    try {
      const [resBookings, resMe] = await Promise.all([
        fetch("http://localhost:4000/api/booking/my-bookings", { headers: { "Authorization": `Bearer ${token}` } }),
        fetch("http://localhost:4000/api/auth/me", { headers: { "Authorization": `Bearer ${token}` } })
      ]);
      
      if (resBookings.ok) {
        const bookingsData = await resBookings.json();
        const bookingsList = Array.isArray(bookingsData) ? bookingsData : bookingsData.data || [];
        setBookings(bookingsList);
        
        // Restore active chat if page was refreshed
        const savedActiveChatId = localStorage.getItem("activeChatId");
        const savedActiveTab = localStorage.getItem("activeTab") || "dashboard";
        if (savedActiveChatId && savedActiveTab === 'messages') {
          const foundBooking = bookingsList.find((b: any) => b.id === savedActiveChatId);
          if (foundBooking) {
            setActiveChat(foundBooking);
            fetchChatHistory(foundBooking.id, 1, false);
          }
        }
      }
      if (resMe.ok) {
        const meData = await resMe.json();
        setUser(meData.user);
        localStorage.setItem("user", JSON.stringify(meData.user));
      }
      
      await fetchTutors();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleVerifyOtpDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return showToast("Please enter the OTP.", "error");
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("http://localhost:4000/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, otp })
      });
      const data = await res.json();
      if (res.ok) {
        showToast("OTP verified successfully!", "success");
        const updatedUser = { ...user, isVerified: true };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        localStorage.setItem("token", data.token);
        fetchData();
      } else {
        showToast(data.error || "Verification failed", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error verifying OTP", "error");
    } finally {
      setIsVerifyingOtp(false);
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

  const deleteAccount = async () => {
    if (!confirm('⚠️ Are you sure you want to permanently delete your account? This action cannot be undone. All your data, bookings, and messages will be lost.')) return;
    if (!confirm('This is your FINAL confirmation. Delete account permanently?')) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/profile/delete-account", {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.setItem("toastMessage", JSON.stringify({ message: "Your account has been permanently deleted.", type: "success" }));
        router.push("/login");
      } else {
        showToast("Failed to delete account.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error deleting account.", "error");
    }
  };

  const cancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? If you paid, you might get a refund based on our policy.")) return;
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:4000/api/booking/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ bookingId })
      });
      if (res.ok) {
        showToast("Booking cancelled.", "success");
        fetchData();
      } else {
        const err = await res.json();
        showToast(err.error || "Failed to cancel booking", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error cancelling booking.", "error");
    }
  };

  const handleBookSlot = async () => {
    if (!selectedTutor || !bookingDate || !bookingTime) return showToast("Select date and time.", "error");
    setIsBooking(true);
    const token = localStorage.getItem("token");

    // Safe cross-browser local date parsing
    const [year, month, day] = bookingDate.split('-').map(Number);
    const [hour, minute] = bookingTime.split(':').map(Number);
    const start = new Date(year, month - 1, day, hour, minute, 0);

    if (isNaN(start.getTime())) {
      showToast("Invalid date or time selected. Please select a valid slot.", "error");
      setIsBooking(false);
      return;
    }

    const end = new Date(start.getTime() + 60 * 60 * 1000); 

    try {
      const createRes = await fetch("http://localhost:4000/api/booking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ tutorId: selectedTutor.userId, startTime: start.toISOString(), endTime: end.toISOString(), amount: selectedTutor.hourlyRate })
      });
      const createData = await createRes.json();

      if (createRes.ok) {
        const options: any = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_T2FcJDXckdlgIZ",
          amount: createData.booking.amount * 100,
          currency: "INR",
          name: "Educator Hub",
          description: `Session with ${selectedTutor.user.name}`,
          handler: async function (response: any) {
            const verifyRes = await fetch("http://localhost:4000/api/booking/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
              body: JSON.stringify({ 
                bookingId: createData.booking.id, 
                razorpayPaymentId: response.razorpay_payment_id || `pay_mock_${Date.now()}`, 
                razorpayOrderId: response.razorpay_order_id || createData.orderId, 
                razorpaySignature: response.razorpay_signature || "MOCK" 
              })
            });

            if (verifyRes.ok) {
              showToast("Payment Successful! Booking Confirmed.", "success");
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

        options.order_id = createData.orderId;
        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          showToast("Payment Failed: " + response.error.description, "error");
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
    localStorage.setItem("activeChatId", booking.id);
    fetchChatHistory(booking.id, 1, false);
    if (socket) socket.emit("join_room", booking.id);
  };

  const sendMessage = () => {
    if (!chatInput.trim() || !activeChat || !socket) return;
    const messageData = { room: activeChat.id, senderId: user.id, content: chatInput, message: chatInput };
    socket.emit("send_message", messageData);
    setChatInput("");
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !activeChat || !socket) return;
    const file = e.target.files[0];
    const token = localStorage.getItem("token");
    
    showToast("Uploading file...", "info");
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
        const messageData = { room: activeChat.id, senderId: user.id, content: `[FILE] ${data.url}`, message: `[FILE] ${data.url}` };
        socket.emit("send_message", messageData);
        showToast("File sent!", "success");
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
                        b.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                        b.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right flex items-center justify-end gap-2">
                      {b.status === 'CONFIRMED' && (
                        <button onClick={() => markCompleted(b.id)} className="text-[#F26522] text-[12px] font-bold hover:underline">Complete</button>
                      )}
                      {b.status === 'COMPLETED' && (
                        <button onClick={() => setRatingBooking(b)} className="bg-gray-900 text-white px-3 py-1.5 rounded-lg text-[11px] font-bold hover:bg-black transition shadow-sm">Rate</button>
                      )}
                      {(b.status === 'PENDING' || b.status === 'CONFIRMED') && (
                        <button onClick={() => cancelBooking(b.id)} className="text-red-500 text-[12px] font-bold hover:underline">Cancel</button>
                      )}
                      {(b.status === 'CONFIRMED' || b.status === 'COMPLETED') && (
                        <button onClick={() => setDisputeBooking(b)} className="text-amber-500 text-[12px] font-bold hover:underline">Dispute</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {disputeBooking && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setDisputeBooking(null)} className="absolute top-4 right-4 w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <X size={16} />
            </button>
            <h2 className="text-[18px] font-bold text-gray-900 mb-1">Open Dispute</h2>
            <p className="text-[13px] text-gray-500 mb-4">Report an issue with this session.</p>
            
            <div className="space-y-4 mb-6">
              <textarea 
                placeholder="Please describe the issue..."
                value={disputeReason}
                onChange={e => setDisputeReason(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent focus:bg-white focus:border-orange-200 outline-none text-[13px] h-24 resize-none border border-gray-200"
              ></textarea>
            </div>
            <button onClick={submitDispute} className="w-full bg-amber-500 text-white py-3.5 rounded-xl text-[13px] font-bold hover:bg-amber-600 transition shadow-md">
              Submit Dispute
            </button>
          </div>
        </div>
      )}

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
                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Phone Number</label>
                    <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-transparent text-[13px] font-medium text-gray-800 focus:outline-none focus:bg-white focus:border-orange-200 focus:ring-2 focus:ring-orange-50 transition-all" />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-[13px] font-bold text-gray-900">Account Status</p>
                      <p className="text-[11px] text-gray-500 font-medium">Platform approval</p>
                    </div>
                    {isApproved ? (
                      <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-emerald-200/60">Approved</span>
                    ) : user.studentProfile?.status === 'REJECTED' ? (
                      <span className="bg-rose-50 text-rose-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-rose-200/60">Rejected</span>
                    ) : (
                      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide border border-amber-200/60">Pending Approval</span>
                    )}
                  </div>
                </div>

                <button onClick={updateProfile} disabled={isUpdating} className="mt-8 bg-gray-900 text-white px-6 py-3 rounded-xl text-[13px] font-bold hover:bg-black transition shadow-sm w-full md:w-auto disabled:opacity-50">
                  {isUpdating ? "Saving..." : "Save Changes"}
                </button>

                {/* Danger Zone */}
                <div className="mt-10 pt-6 border-t border-red-100">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle size={16} className="text-red-500" />
                    <h3 className="text-[14px] font-bold text-red-600">Danger Zone</h3>
                  </div>
                  <div className="bg-red-50/50 rounded-xl p-4 border border-red-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[13px] font-bold text-gray-900">Delete Account</p>
                        <p className="text-[11px] text-gray-500 font-medium mt-0.5">Permanently delete your account and all associated data.</p>
                      </div>
                      <button onClick={deleteAccount} className="bg-red-500 text-white px-4 py-2 rounded-lg text-[12px] font-bold hover:bg-red-600 transition flex items-center gap-1.5 shrink-0">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>

      {toast && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl animate-in slide-in-from-top-5 duration-300 font-sans max-w-sm ${
          toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200/50 text-emerald-800' :
          toast.type === 'error' ? 'bg-rose-50/90 border-rose-200/50 text-rose-800' :
          'bg-orange-50/90 border-orange-200/50 text-orange-950'
        }`}>
          {toast.type === 'success' && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
          {toast.type === 'error' && <ShieldAlert size={18} className="text-rose-500 shrink-0" />}
          {toast.type === 'info' && <Bell size={18} className="text-[#F26522] shrink-0" />}
          <span className="text-[13px] font-bold leading-snug">{toast.message}</span>
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
