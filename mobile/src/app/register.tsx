import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";

const API_URL = "http://10.0.2.2:4000/api";

export default function RegisterScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !password) return Alert.alert("Error", "Please fill all fields");
    setIsLoading(true);
    try {
      await axios.post(`${API_URL}/auth/register`, { name, email, password, role });
      Alert.alert("Success", "Registration successful! Please login.");
      router.replace("/login");
    } catch (err: any) {
      Alert.alert("Registration Failed", err.response?.data?.error || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Create Account</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput style={styles.input} value={name} onChangeText={setName} />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>I am a...</Text>
          <View style={styles.roleContainer}>
            <TouchableOpacity onPress={() => setRole("STUDENT")} style={[styles.roleBtn, role === "STUDENT" && styles.roleActive]}>
              <Text style={[styles.roleText, role === "STUDENT" && styles.roleActiveText]}>Student</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setRole("TUTOR")} style={[styles.roleBtn, role === "TUTOR" && styles.roleActive]}>
              <Text style={[styles.roleText, role === "TUTOR" && styles.roleActiveText]}>Tutor</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={isLoading}>
          {isLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/login")} style={styles.linkContainer}>
          <Text style={styles.linkText}>Already have an account? <Text style={styles.linkBold}>Log in</Text></Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa", justifyContent: "center", padding: 20 },
  card: { backgroundColor: "#fff", padding: 24, borderRadius: 16, elevation: 2, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: "bold", color: "#1f2937", textAlign: "center", marginBottom: 24 },
  inputContainer: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: "bold", color: "#4b5563", marginBottom: 8, textTransform: "uppercase" },
  input: { backgroundColor: "#f3f4f6", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: "#1f2937" },
  roleContainer: { flexDirection: "row", gap: 10 },
  roleBtn: { flex: 1, padding: 12, borderRadius: 10, backgroundColor: "#f3f4f6", alignItems: "center" },
  roleActive: { backgroundColor: "#ffedd5", borderColor: "#F26522", borderWidth: 1 },
  roleText: { fontSize: 14, fontWeight: "bold", color: "#6b7280" },
  roleActiveText: { color: "#ea580c" },
  button: { backgroundColor: "#F26522", padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  linkContainer: { marginTop: 24, alignItems: "center" },
  linkText: { color: "#6b7280", fontSize: 14 },
  linkBold: { color: "#F26522", fontWeight: "bold" },
});
