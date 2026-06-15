import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { LogOut } from "lucide-react-native";

const API_URL = "http://10.0.2.2:4000/api";

export default function TutorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
        
        const res = await axios.get(`${API_URL}/booking/tutor-bookings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBookings(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.clear();
    router.replace("/login");
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#F26522" /></View>;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Welcome, {user?.name}</Text>
          <Text style={styles.headerSubtitle}>Tutor Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Sessions</Text>
      
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.studentName}>Student: {item.student.name}</Text>
              <View style={[styles.statusBadge, item.status === 'CONFIRMED' ? styles.statusConfirmed : styles.statusCompleted]}>
                <Text style={[styles.statusText, item.status === 'CONFIRMED' ? styles.statusTextConfirmed : styles.statusTextCompleted]}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.timeText}>{new Date(item.startTime).toLocaleString()}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No sessions booked yet.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 60, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: "#1f2937" },
  headerSubtitle: { fontSize: 13, color: "#6b7280" },
  logoutBtn: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", margin: 20, color: "#1f2937" },
  list: { paddingHorizontal: 20, paddingBottom: 20 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  studentName: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  timeText: { fontSize: 14, color: "#4b5563" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusConfirmed: { backgroundColor: "#dbeafe" },
  statusCompleted: { backgroundColor: "#d1fae5" },
  statusText: { fontSize: 10, fontWeight: "bold", textTransform: "uppercase" },
  statusTextConfirmed: { color: "#1d4ed8" },
  statusTextCompleted: { color: "#047857" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});
