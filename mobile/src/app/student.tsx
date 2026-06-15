import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { useRouter } from "expo-router";
import { BookOpen, User, LogOut } from "lucide-react-native";

const API_URL = "http://10.0.2.2:4000/api";

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [tutors, setTutors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        const userStr = await AsyncStorage.getItem("user");
        if (userStr) setUser(JSON.parse(userStr));
        
        const res = await axios.get(`${API_URL}/marketplace/tutors`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setTutors(res.data);
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
          <Text style={styles.headerSubtitle}>Student Dashboard</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <LogOut size={20} color="#ef4444" />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Available Tutors</Text>
      
      <FlatList
        data={tutors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.tutorCard}>
            <View style={styles.tutorHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.user.name.charAt(0)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.tutorName}>{item.user.name}</Text>
                <Text style={styles.tutorSubjects}>{item.subjects?.join(', ') || 'Various subjects'}</Text>
              </View>
            </View>
            <Text style={styles.tutorBio} numberOfLines={2}>{item.bio || 'Expert tutor ready to help.'}</Text>
            <View style={styles.tutorFooter}>
              <Text style={styles.tutorRate}>${item.hourlyRate}/hr</Text>
              <TouchableOpacity style={styles.bookBtn}>
                <Text style={styles.bookBtnText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No tutors available at the moment.</Text>}
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
  tutorCard: { backgroundColor: "#fff", padding: 16, borderRadius: 16, marginBottom: 16, elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 5 },
  tutorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#ffedd5", justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#ea580c", fontSize: 18, fontWeight: "bold" },
  tutorName: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  tutorSubjects: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  tutorBio: { fontSize: 14, color: "#4b5563", marginBottom: 16, lineHeight: 20 },
  tutorFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#f3f4f6" },
  tutorRate: { fontSize: 16, fontWeight: "bold", color: "#1f2937" },
  bookBtn: { backgroundColor: "#F26522", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  bookBtnText: { color: "#fff", fontWeight: "bold", fontSize: 13 },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
});
